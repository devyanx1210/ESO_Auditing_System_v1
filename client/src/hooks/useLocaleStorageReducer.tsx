import { useEffect, useReducer } from "react";

export function useLocalStorageReducer(
    reducer: any,
    initialState: any,
    storageKey: string
) {
    // Load from localStorage
    const initializer = () => {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : initialState;
    };

    const [state, dispatch] = useReducer(reducer, initialState, initializer);

    // Save to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(state));
    }, [state, storageKey]);

    // Custom helpers
    const clearStorage = () => {
        localStorage.removeItem(storageKey);
    };

    const getStorage = () => {
        return JSON.parse(localStorage.getItem(storageKey) || "null");
    };

    return { state, dispatch, clearStorage, getStorage };
}
