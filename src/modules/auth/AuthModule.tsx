import { useAuthorization } from './model/useAuthorization'
import { AuthForm } from './ui/AuthForm'
import { AuthHeader } from './ui/AuthHeader'
import { AuthLayout } from './ui/AuthLayout'
import { ConnectedAccount } from './ui/ConnectedAccount'

export function AuthModule() {
  const { state, connect, clearError, disconnect } = useAuthorization()

  return (
    <AuthLayout>
      {state.status === 'connected' ? (
        <ConnectedAccount idInstance={state.credentials.idInstance} onDisconnect={disconnect} />
      ) : (
        <>
          <AuthHeader />
          <AuthForm
            isLoading={state.status === 'loading'}
            error={state.status === 'error' ? state.message : ''}
            onConnect={connect}
            onEdit={clearError}
          />
        </>
      )}
    </AuthLayout>
  )
}
