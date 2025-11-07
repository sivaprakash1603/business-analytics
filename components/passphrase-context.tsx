"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { encryptObject, decryptObject } from "@/lib/client-crypto"

interface PassphraseContextValue {
	passphrase: string | null
	setPassphrase: (p: string) => void
	clearPassphrase: () => void
	encryptPayload: (obj: any) => Promise<any>
	decryptPayload: (encrypted: any) => Promise<any>
	isReady: boolean
}

const PassphraseContext = createContext<PassphraseContextValue | undefined>(undefined)

export function PassphraseProvider({ children }: { children: React.ReactNode }) {
	const [passphrase, setPassphraseState] = useState<string | null>(null)
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		try {
			const stored = localStorage.getItem("insightx_passphrase")
			if (stored) setPassphraseState(stored)
		} catch { }
		setIsReady(true)
	}, [])

	const setPassphrase = useCallback((p: string) => {
		setPassphraseState(p)
		try { localStorage.setItem("insightx_passphrase", p) } catch { }
	}, [])

	const clearPassphrase = useCallback(() => {
		setPassphraseState(null)
		try { localStorage.removeItem("insightx_passphrase") } catch { }
	}, [])

	const encryptPayload = useCallback(async (obj: any) => {
		if (!passphrase) throw new Error("Passphrase not set")
		return encryptObject(obj, passphrase)
	}, [passphrase])

	const decryptPayload = useCallback(async (encrypted: any) => {
		if (!passphrase) throw new Error("Passphrase not set")
		return decryptObject(encrypted, passphrase)
	}, [passphrase])

	return (
		<PassphraseContext.Provider value={{ passphrase, setPassphrase, clearPassphrase, encryptPayload, decryptPayload, isReady }}>
			{children}
		</PassphraseContext.Provider>
	)
}

export function usePassphrase() {
	const ctx = useContext(PassphraseContext)
	if (!ctx) throw new Error("usePassphrase must be used within PassphraseProvider")
	return ctx
}
