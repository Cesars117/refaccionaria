'use client'

import { signIn } from "next-auth/react"
import Image from 'next/image'
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Credenciales inválidas')
        } else {
          setError(`No se pudo iniciar sesión (${result.error})`)
        }
      } else {
        router.push('/')
      }
    } catch {
      setError('Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top, #20345f 0%, #10192f 52%, #0b1020 100%)',
      padding: '24px'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #182542 0%, #ffffff 36%)',
        padding: '2rem',
        borderRadius: '20px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            position: 'relative',
            marginBottom: '1rem',
            background: 'linear-gradient(145deg, #0d1428 0%, #142447 100%)',
            width: '112px',
            height: '112px',
            borderRadius: '20px',
            margin: '0 auto 1.5rem auto'
          }}>
            <Image
              src="/logoradiamex.jpg"
              alt="A/C Radiamex"
              fill
              style={{ objectFit: 'contain', borderRadius: '20px', padding: '10px' }}
              priority
            />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem', color: '#ffffff', letterSpacing: '-0.025em' }}>
            A/C Radiamex
          </h1>
          <p style={{ color: '#9cb3da', fontSize: '0.95rem' }}>
            Venta de Radiadores y Sistemas de Enfriamiento
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'white', padding: '1.5rem', borderRadius: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fee2e2', 
              borderRadius: '8px', 
              color: '#991b1b',
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: loading ? '#9ca3af' : '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Iniciando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0, textAlign: 'center' }}>
            <strong style={{ color: '#fff' }}>A/C Radiamex</strong><br />
            <span style={{ color: '#b7c7e4' }}>
            Usa tus credenciales de acceso.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}