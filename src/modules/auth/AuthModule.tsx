import type { GreenApiCredentials } from "../../shared/api/green-api/types";
import { AuthForm } from "./ui/AuthForm";
import { AuthHeader } from "./ui/AuthHeader";
import { AuthLayout } from "./ui/AuthLayout";

interface AuthModuleProps {
  isLoading: boolean;
  error: string;
  onConnect: (credentials: GreenApiCredentials) => Promise<void>;
  onEdit: () => void;
}

export function AuthModule(props: AuthModuleProps) {
  return (
    <AuthLayout>
      <AuthHeader />
      <AuthForm {...props} />
    </AuthLayout>
  );
}
