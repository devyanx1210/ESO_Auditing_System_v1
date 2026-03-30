import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import type { AuthenticatedUser, LoginInput, RegisterInput } from "../types/auth.types";
import { authService } from "../services/auth.service";

interface AuthContextType {
    user: AuthenticatedUser | null;
    accessToken: string | null;
    isLoading: boolean;
    login: (input: LoginInput) => Promise<AuthenticatedUser>;
    register: (input: RegisterInput) => Promise<AuthenticatedUser>;
    logout: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "eso_user";
const REFRESH_KEY = "eso_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: restore session from localStorage
    useEffect(() => {
        const init = async () => {
            const storedUser = localStorage.getItem(USER_KEY);
            const storedRefresh = localStorage.getItem(REFRESH_KEY);

            if (storedUser && storedRefresh) {
                try {
                    setUser(JSON.parse(storedUser));
                    const { accessToken: newToken, user: freshUser } = await authService.refresh(storedRefresh);
                    setAccessToken(newToken);
                    setUser(freshUser);
                    localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
                } catch {
                    localStorage.removeItem(USER_KEY);
                    localStorage.removeItem(REFRESH_KEY);
                    setUser(null);
                }
            }

            setIsLoading(false);
        };

        init();
    }, []);

    const login = useCallback(async (input: LoginInput): Promise<AuthenticatedUser> => {
        const { user, tokens } = await authService.login(input);
        setUser(user);
        setAccessToken(tokens.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
        return user;
    }, []);

    const register = useCallback(async (input: RegisterInput): Promise<AuthenticatedUser> => {
        const { user, tokens } = await authService.register(input);
        setUser(user);
        setAccessToken(tokens.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
        return user;
    }, []);

    const logout = useCallback(async () => {
        if (accessToken) {
            try { await authService.logout(accessToken); } catch { /* ignore */ }
        }
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REFRESH_KEY);
    }, [accessToken]);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        if (!accessToken) throw new Error("Not authenticated");
        await authService.changePassword(accessToken, currentPassword, newPassword);
    }, [accessToken]);

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
