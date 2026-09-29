import type { ObjectDirective } from 'vue'

export type InputMask = 'phone' | 'cpf' | 'zipcode' | 'card' | 'expiry' | 'cvv' | 'otp'

const patterns: Record<Exclude<InputMask, 'phone' | 'card'>, string> = {
  cpf: '###.###.###-##',
  zipcode: '#####-###',
  expiry: '##/##',
  cvv: '####',
  otp: '######',
}

export function formatInput(value: string, mask: InputMask): string {
  let digits = value.replace(/\D/g, '')
  let prefix = ''
  let pattern: string

  if (mask === 'phone') {
    if (value.trim().startsWith('+')) {
      if (!digits.startsWith('55')) return `+${digits.slice(0, 15)}`
      prefix = '+55 '
      digits = digits.slice(2)
    }
    pattern = digits.length > 10 ? '(##) #####-####' : '(##) ####-####'
  } else if (mask === 'card') {
    pattern = /^3[47]/.test(digits) ? '#### ###### #####' : '#### #### #### #### ###'
  } else {
    pattern = patterns[mask]
  }

  let result = prefix
  let index = 0
  for (const character of pattern) {
    if (index >= digits.length) break
    result += character === '#' ? digits[index++] : character
  }
  return result.trimEnd()
}

export function maskSelection(value: string, cursor: number, mask: InputMask): { value: string, cursor: number } {
  const formatted = formatInput(value, mask)
  const count = value.slice(0, cursor).replace(/\D/g, '').length
  let position = 0
  let seen = 0
  while (position < formatted.length && seen < count) {
    if (/\d/.test(formatted[position]!)) seen++
    position++
  }
  return { value: formatted, cursor: position }
}

const listeners = new WeakMap<HTMLInputElement, EventListener>()

function syncValue(element: HTMLInputElement, mask: InputMask) {
  const value = formatInput(element.value, mask)
  if (element.value !== value) element.value = value
}

export const vMask: ObjectDirective<HTMLInputElement, InputMask> = {
  created(element, binding) {
    element.dataset.inputMask = binding.value
    const listener: EventListener = (event) => {
      if ((event as InputEvent).isComposing) return
      const result = maskSelection(element.value, element.selectionStart ?? element.value.length, element.dataset.inputMask as InputMask)
      if (element.value !== result.value) {
        element.value = result.value
        element.setSelectionRange(result.cursor, result.cursor)
      }
    }
    listeners.set(element, listener)
    element.addEventListener('input', listener, true)
  },
  mounted(element, binding) {
    syncValue(element, binding.value)
  },
  updated(element, binding) {
    element.dataset.inputMask = binding.value
    syncValue(element, binding.value)
  },
  beforeUnmount(element) {
    const listener = listeners.get(element)
    if (listener) element.removeEventListener('input', listener, true)
    listeners.delete(element)
  },
  getSSRProps(binding, vnode) {
    if (!vnode?.props || vnode.props.value === undefined) return {}
    return { value: formatInput(String(vnode.props.value ?? ''), binding.value) }
  },
}
