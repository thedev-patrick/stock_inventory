export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Maximum length check (prevent DoS attacks)
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }

  // Character type checks
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!hasNumber) {
    errors.push('Password must contain at least one number')
  }

  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character')
  }

  // Calculate strength
  const strengthScore = [
    password.length >= 12,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length

  if (strengthScore >= 5) {
    strength = 'strong'
  } else if (strengthScore >= 3) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
  }
}

export function getPasswordStrengthBg(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
  }
}
