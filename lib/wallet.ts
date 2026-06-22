const EVM_ADDRESS_PATTERN = /^0x[0-9A-Fa-f]{40}$/;

export function isEvmAddress(value: string) {
  return EVM_ADDRESS_PATTERN.test(value.trim());
}

