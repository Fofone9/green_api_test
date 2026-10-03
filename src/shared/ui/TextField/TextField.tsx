import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, id, className, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const description = error || hint
  const descriptionId = description ? `${inputId}-description` : undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={[styles.input, className].filter(Boolean).join(' ')}
      />
      {description && (
        <p id={descriptionId} className={error ? styles.error : styles.hint}>
          {description}
        </p>
      )}
    </div>
  )
}
