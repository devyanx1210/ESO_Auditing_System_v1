import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    message: string;
}

// Catches unhandled render errors so the whole app doesn't white-screen.
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: "" };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(_error: Error, info: ErrorInfo) {
        // In production, send to an error tracking service here
        if (import.meta.env.DEV) {
            console.error("ErrorBoundary caught:", info.componentStack);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="max-w-md w-full text-center">
                        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-orange-600">!</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            {this.state.message || "An unexpected error occurred. Please reload the page."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
