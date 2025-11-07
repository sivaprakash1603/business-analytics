"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePassphrase } from "@/components/passphrase-context"
import { Lock, LockOpen, RefreshCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import clientCrypto from "@/lib/client-crypto"

export function PassphraseControl() {
    const { passphrase, setPassphrase, clearPassphrase } = usePassphrase()
    const [value, setValue] = useState("")
    const [open, setOpen] = useState(false)
    const [oldKey, setOldKey] = useState("")
    const [newKey, setNewKey] = useState("")
    const [confirmKey, setConfirmKey] = useState("")
    const [rotating, setRotating] = useState(false)
    const [progress, setProgress] = useState<string>("")
    const { user } = useAuth()

    useEffect(() => {
        setValue("")
    }, [passphrase])

    const onSet = () => {
        if (!value.trim()) return
        setPassphrase(value.trim())
        setValue("")
    }

    const onClear = () => {
        clearPassphrase()
        setValue("")
    }

    return (
        <div className="flex items-center gap-2">
            {passphrase ? (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Lock className="h-3 w-3 mr-1" /> Set
                </span>
            ) : (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                    <LockOpen className="h-3 w-3 mr-1" /> Not set
                </span>
            )}
            <Input
                type="password"
                placeholder={passphrase ? "Passphrase set" : "Session passphrase"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-48 h-8"
            />
            <Button size="sm" className="h-8" onClick={onSet} disabled={!value.trim()}>Set</Button>
            <Button size="sm" variant="outline" className="h-8" onClick={onClear}>Clear</Button>
            <Button size="sm" variant="secondary" className="h-8" onClick={() => {
                setOldKey(passphrase || "")
                setNewKey("")
                setConfirmKey("")
                setOpen(true)
            }}>
                <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Rotate
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rotate Passphrase</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="flex items-center gap-2">
                            <Input type="password" placeholder="Current passphrase" value={oldKey} onChange={e => setOldKey(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Input type="password" placeholder="New passphrase" value={newKey} onChange={e => setNewKey(e.target.value)} />
                            <Input type="password" placeholder="Confirm new" value={confirmKey} onChange={e => setConfirmKey(e.target.value)} />
                        </div>
                        {progress && <p className="text-xs text-muted-foreground">{progress}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={rotating}>Cancel</Button>
                        <Button onClick={async () => {
                            if (!user?.uid) return
                            if (!oldKey || !newKey || newKey !== confirmKey) {
                                setProgress("Please provide current passphrase and matching new passphrase.")
                                return
                            }
                            setRotating(true)
                            setProgress("Fetching records…")
                            try {
                                const endpoints: Array<{ key: 'income' | 'spending' | 'loans' | 'clients' | 'todos', url: string, field: string }> = [
                                    { key: 'income', url: `/api/income?userId=${encodeURIComponent(user.uid)}`, field: 'entries' },
                                    { key: 'spending', url: `/api/spending?userId=${encodeURIComponent(user.uid)}`, field: 'entries' },
                                    { key: 'loans', url: `/api/loans?userId=${encodeURIComponent(user.uid)}`, field: 'entries' },
                                    { key: 'clients', url: `/api/clients?userId=${encodeURIComponent(user.uid)}`, field: 'clients' },
                                    { key: 'todos', url: `/api/todos?userId=${encodeURIComponent(user.uid)}`, field: 'entries' },
                                ] as any

                                const responses = await Promise.all(endpoints.map(e => fetch(e.url)))
                                const payloads = await Promise.all(responses.map(r => r.json()))

                                const updates: Array<Promise<any>> = []
                                const addUpdates = (items: any[], key: string) => {
                                    for (const item of items) {
                                        if (item.__encrypted && item.encrypted && item._id) {
                                            updates.push((async () => {
                                                try {
                                                    const dec = await clientCrypto.decryptObject(item.encrypted, oldKey)
                                                    const enc = await clientCrypto.encryptObject(dec, newKey)
                                                    const body = JSON.stringify({ id: item._id, userId: user.uid, __encrypted: true, encrypted: enc })
                                                    const path = key === 'income' ? '/api/income' : key === 'spending' ? '/api/spending' : key === 'loans' ? '/api/loans' : key === 'clients' ? '/api/clients' : '/api/todos'
                                                    const res = await fetch(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
                                                    if (!res.ok) throw new Error(`${key} update failed`)
                                                } catch (e) {
                                                    console.error(`[Rotate] ${key} item failed`, e)
                                                    // continue with others
                                                }
                                            })())
                                        }
                                    }
                                }

                                for (let i = 0; i < endpoints.length; i++) {
                                    const { key, field } = endpoints[i] as any
                                    const items = payloads[i]?.[field] || []
                                    addUpdates(items, key)
                                }

                                setProgress(`Re-encrypting ${updates.length} items…`)
                                await Promise.allSettled(updates)

                                // Set new passphrase locally
                                setPassphrase(newKey)
                                setProgress("Rotation complete.")
                                setTimeout(() => setOpen(false), 800)
                            } catch (e) {
                                console.error('[Rotate] error', e)
                                setProgress('Rotation encountered errors. Check console for details.')
                            } finally {
                                setRotating(false)
                            }
                        }} disabled={rotating}>Rotate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
