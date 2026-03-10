// Feature-specific auth types (extends base types from @/types)
export type AuthFormMode = 'login' | 'signup' | 'forgot-password';

export interface AuthFormState {
    mode: AuthFormMode;
    isSubmitting: boolean;
    error: string | null;
}
