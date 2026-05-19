import React from "react";
import { AppToast } from "../../../components/common/AppToast";

interface AuthErrorToastProps {
  message?: string | null;
  onClose?: () => void;
  floating?: boolean;
  variant?: "error" | "success";
}

export const AuthErrorToast: React.FC<AuthErrorToastProps> = (props) => (
  <AppToast {...props} />
);
