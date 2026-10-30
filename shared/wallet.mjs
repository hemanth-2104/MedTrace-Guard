// EIP-1193 wallet state. Tests simulate provider behavior; they do not prove an extension was used.
const sameAddress = (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
const validAddress = value => /^0x[0-9a-f]{40}$/i.test(value ?? '');
const chainNumber = value => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) {throw new Error('Wallet returned an invalid chain ID.');}
  return n;
};
export function allowsLocalSigning(deployment, hostname) {
  return Number(deployment?.chainId) === 31337 && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
}
export function walletMessage(error) {
  const code = error?.code ?? error?.info?.error?.code ?? error?.error?.code;
  if (Number(code) === 4001 || code === 'ACTION_REJECTED') {return 'Wallet request rejected. No new wallet connection or signature was approved.';}
  if (Number(code) === -32002) {return 'A wallet request is already pending. Open MetaMask to finish or reject it.';}
  if ([4900, 4901].includes(Number(code))) {return 'Wallet disconnected. Reconnect before signing.';}
  return error?.shortMessage ?? error?.message ?? String(error);
}
export function walletChainParameters(deployment) {
  const id = Number(deployment.chainId);
  if (id === 31337) {
    const rpc = new URL(deployment.rpcUrl);
    if (!['http:', 'https:'].includes(rpc.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(rpc.hostname) || rpc.username || rpc.password || rpc.search || rpc.hash) {throw new Error('Adding the local demo chain requires a loopback HTTP(S) RPC URL without credentials.');}
    return { chainId: '0x7a69', chainName: 'MedTrace local demo', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: [rpc.href] };
  }
  if (id === 80002) {
    const rpc = new URL(deployment.rpcUrl);
    const host = rpc.hostname.toLowerCase();
    if (rpc.protocol !== 'https:' || rpc.username || rpc.password || rpc.search || rpc.hash || host === 'localhost' || host.endsWith('.local') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) {throw new Error('Adding Amoy requires a public HTTPS RPC URL without credentials or query parameters. Add the network manually in MetaMask.');}
    return { chainId: '0x13882', chainName: 'Polygon Amoy', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 }, rpcUrls: [rpc.href], blockExplorerUrls: ['https://amoy.polygonscan.com'] };
  }
  throw new Error('Add this deployment network in MetaMask manually, then switch and reconnect.');
}
export class WalletSession {
  constructor(onChange = () => {}) {
    this.onChange = onChange;
    this.state = { mode: 'readonly', account: '', chainId: null };
    this.version = 0;
    this.provider = null;
    this.browserProvider = null;
    this.handlers = null;
    this.connecting = false;
  }
  snapshot() { return { ...this.state }; }
  emit(message = '') { this.onChange(this.snapshot(), message); }
  clear(message = '') {
    this.version++;
    this.connecting = false;
    if (this.handlers) {for (const [event, handler] of Object.entries(this.handlers)) {this.provider?.removeListener?.(event, handler);}}
    this.handlers = null;
    this.provider = null;
    this.browserProvider?.destroy?.();
    this.browserProvider = null;
    this.state = { mode: 'readonly', account: '', chainId: null };
    this.emit(message);
  }
  selectLocal(deployment, hostname, account) {
    this.clear();
    if (!account) {return;}
    if (!allowsLocalSigning(deployment, hostname) || !validAddress(account) || !deployment.localAccounts?.some(a => sameAddress(a, account))) {throw new Error('Local demo signing is allowed only for listed accounts on the localhost demo chain.');}
    this.state = { mode: 'local', account, chainId: 31337 };
    this.emit('Local demo signing selected. Transactions use the local unlocked RPC account.');
  }
  listen(provider) {
    this.provider = provider;
    const invalidate = message => {
      // Initial permission approval often emits accountsChanged before requestAccounts resolves.
      // Connect reads the provider's current accounts and chain after approval.
      if (!this.connecting) {this.clear(message);}
    };
    this.handlers = {
      accountsChanged: () => invalidate('Wallet account changed or disconnected. Reconnect before signing.'),
      chainChanged: () => invalidate('Wallet network changed. Reconnect before signing.'),
      disconnect: () => this.clear('Wallet disconnected. Reconnect before signing.')
    };
    for (const [event, handler] of Object.entries(this.handlers)) {provider.on?.(event, handler);}
  }
  async connect(provider, deployment) {
    this.clear();
    if (!provider?.request) {throw new Error('MetaMask is unavailable in this browser. Install or enable the extension, or select a local demo account.');}
    const version = this.version;
    this.connecting = true;
    this.listen(provider);
    try {
      await provider.request({ method: 'eth_requestAccounts' });
      const [accounts, chain] = await Promise.all([provider.request({ method: 'eth_accounts' }), provider.request({ method: 'eth_chainId' })]);
      if (version !== this.version) {throw new Error('Wallet connection superseded. Connect again.');}
      if (!Array.isArray(accounts) || !validAddress(accounts[0])) {throw new Error('No wallet account is authorized. Unlock MetaMask and connect again.');}
      const chainId = chainNumber(chain);
      if (chainId !== Number(deployment.chainId)) {throw new Error(`Wallet is on chain ${chainId}. Switch to deployment chain ${deployment.chainId}, then reconnect.`);}
      this.connecting = false;
      this.state = { mode: 'wallet', account: accounts[0], chainId };
      this.emit('MetaMask signing selected. Each transaction requires wallet approval.');
      return this.snapshot();
    } catch (error) {
      if (version === this.version) {this.clear();}
      throw error;
    }
  }
  async switchNetwork(provider, deployment) {
    this.clear();
    if (!provider?.request) {throw new Error('MetaMask is unavailable in this browser.');}
    const chainId = `0x${chainNumber(deployment.chainId).toString(16)}`;
    const version = this.version;
    const current = () => { if (version !== this.version) {throw new Error('Wallet network request superseded. Connect again.');} };
    try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] }); }
    catch (error) {
      current();
      if (Number(error.code ?? error?.data?.originalError?.code) !== 4902) {throw error;}
      await provider.request({ method: 'wallet_addEthereumChain', params: [walletChainParameters(deployment)] });
      current();
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    }
    current();
    return this.connect(provider, deployment);
  }
  async assertWallet(deployment, version) {
    if (this.state.mode !== 'wallet' || !this.provider) {throw new Error('Reconnect MetaMask before signing.');}
    const provider = this.provider;
    let accounts, chain;
    try { [accounts, chain] = await Promise.all([provider.request({ method: 'eth_accounts' }), provider.request({ method: 'eth_chainId' })]);chainNumber(chain); }
    catch (error) { if (version === this.version) {this.clear('Wallet connection failed. Reconnect before signing.');}throw error; }
    if (version !== this.version || this.state.mode !== 'wallet' || !sameAddress(accounts?.[0], this.state.account) || chainNumber(chain) !== Number(deployment.chainId)) {
      if (version === this.version) {this.clear('Wallet account or network changed. Reconnect before signing.');}
      throw new Error('Wallet account or network changed. Reconnect before signing.');
    }
  }
  async signer({ deployment, hostname, localProvider, createBrowserProvider }) {
    const version = this.version;
    if (this.state.mode === 'local') {
      if (!allowsLocalSigning(deployment, hostname) || !deployment.localAccounts?.some(a => sameAddress(a, this.state.account))) {throw new Error('Local signing is unavailable for this deployment.');}
      const signer = await localProvider.getSigner(this.state.account);
      if (version !== this.version) {throw new Error('Signing account changed. Try again.');}
      return signer;
    }
    await this.assertWallet(deployment, version);
    this.browserProvider ??= createBrowserProvider(this.provider);
    const signer = await this.browserProvider.getSigner(this.state.account);
    if (!sameAddress(await signer.getAddress(), this.state.account)) {throw new Error('Wallet signer account changed. Reconnect.');}
    await this.assertWallet(deployment, version);
    return signer;
  }
}
