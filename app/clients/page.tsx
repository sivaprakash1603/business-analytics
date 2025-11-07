"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import clientCrypto from "@/lib/client-crypto"
import { usePassphrase } from "@/components/passphrase-context"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { MagazineCard } from "@/components/magazine-card"
import { Plus, Users, DollarSign, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Client {
  id: string
  _id?: string
  name: string
  company: string
  description: string
  totalIncome: number
  createdAt: string
}

interface IncomeEntry {
  id: string
  source: string
  amount: number
  date: string
}

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([])
  const [clientName, setClientName] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientDescription, setClientDescription] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { passphrase, encryptPayload, decryptPayload, clearPassphrase } = usePassphrase()

  // Fetch clients from MongoDB on mount and after add/remove
  useEffect(() => {
    async function fetchClientsAndIncome() {
      try {
        const [clientsRes, incomeRes] = await Promise.all([
          fetch("/api/clients?userId=" + user?.uid),
          fetch("/api/income?userId=" + user?.uid)
        ])
        const clientsData = await clientsRes.json()
        const incomeData = await incomeRes.json()
        const clientsList = clientsRes.ok && clientsData.clients ? clientsData.clients : []
        const incomeList = incomeRes.ok && incomeData.entries ? incomeData.entries : []
        // Decrypt client data if encrypted and passphrase is available
        const clientsDecrypted = await Promise.all(clientsList.map(async (client: any) => {
          if (client.__encrypted && client.encrypted) {
            if (passphrase) {
              try {
                const dec = await decryptPayload(client.encrypted)
                return { ...client, ...dec }
              } catch {
                return { ...client, name: 'Encrypted', company: 'Encrypted', description: 'Encrypted' }
              }
            }
            return { ...client, name: 'Encrypted', company: 'Encrypted', description: 'Encrypted' }
          }
          return client
        }))

        // Calculate totalIncome for each client
        const clientsWithIncome = clientsDecrypted.map((client: any) => {
          const clientIncome = incomeList
            .filter((entry: any) => entry.clientId && client.clientId && entry.clientId === client.clientId)
            .reduce((sum: number, entry: any) => sum + entry.amount, 0)
          return { ...client, totalIncome: clientIncome }
        })
        // Ensure each client has a stable id for React key & deletion: prefer Mongo _id, fallback to clientId
        setClients(clientsWithIncome.map((c: any) => ({ ...c, id: c._id?.toString() || c.clientId })))
        setIncomeEntries(incomeList)
      } catch {
        setClients([])
        setIncomeEntries([])
      }
    }
    fetchClientsAndIncome()
  }, [])

  // Re-decrypt when passphrase changes
  useEffect(() => {
    refreshClients()
  }, [passphrase])

  // Clear passphrase on page unload to ensure it's only in-memory for the session
  useEffect(() => {
    const clear = () => clearPassphrase()
    window.addEventListener('beforeunload', clear)
    return () => window.removeEventListener('beforeunload', clear)
  }, [clearPassphrase])

  // Helper to refresh clients and income from DB
  const refreshClients = async () => {
    try {
      const [clientsRes, incomeRes] = await Promise.all([
        fetch("/api/clients?userId=" + user?.uid),
        fetch("/api/income?userId=" + user?.uid)
      ])
      const clientsData = await clientsRes.json()
      const incomeData = await incomeRes.json()
      const clientsList = clientsRes.ok && clientsData.clients ? clientsData.clients : []
      const incomeList = incomeRes.ok && incomeData.entries ? incomeData.entries : []
      // Decrypt if needed using current passphrase
      const clientsDecrypted = await Promise.all(clientsList.map(async (client: any) => {
        if (client.__encrypted && client.encrypted) {
          if (passphrase) {
            try {
              const dec = await decryptPayload(client.encrypted)
              return { ...client, ...dec }
            } catch {
              return { ...client, name: 'Encrypted', company: 'Encrypted', description: 'Encrypted' }
            }
          }
          return { ...client, name: 'Encrypted', company: 'Encrypted', description: 'Encrypted' }
        }
        return client
      }))

      const clientsWithIncome = clientsDecrypted.map((client: any) => {
        const clientIncome = incomeList
          .filter((entry: any) => entry.clientId && client.clientId && entry.clientId === client.clientId)
          .reduce((sum: number, entry: any) => sum + entry.amount, 0)
        return { ...client, totalIncome: clientIncome }
      })
      setClients(clientsWithIncome.map((c: any) => ({ ...c, id: c._id?.toString() || c.clientId })))
      setIncomeEntries(incomeList)
    } catch {
      setClients([])
      setIncomeEntries([])
    }
  }

  const addClient = async () => {
    if (!clientName || !clientCompany) {
      toast({
        title: "Error",
        description: "Please fill in the required fields.",
        variant: "destructive",
      })
      return
    }
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to add a client.",
        variant: "destructive",
      })
      return
    }
    try {
      let bodyPayload: any
      if (passphrase) {
        const encrypted = await encryptPayload({ name: clientName, company: clientCompany, description: clientDescription })
        bodyPayload = { __encrypted: true, encrypted, createdAt: new Date().toISOString(), userId: user.uid }
      } else {
        bodyPayload = { name: clientName, company: clientCompany, description: clientDescription, createdAt: new Date().toISOString(), userId: user.uid }
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("[AddClient] API error:", data)
        toast({
          title: "Error",
          description: data.error || "Failed to store client in database.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Client added successfully!",
      })
      setClientName("")
      setClientCompany("")
      setClientDescription("")
      setIsDialogOpen(false)
      await refreshClients()
    } catch (err) {
      console.error("[AddClient] Network error:", err)
      toast({
        title: "Error",
        description: "Failed to store client in database.",
        variant: "destructive",
      })
    }
  }

  const removeClient = async (id: string) => {
    // Find the correct MongoDB _id field if present
    const client = clients.find(c => c.id === id || c._id === id)
    const mongoId = client?._id || id
    try {
      const res = await fetch("/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mongoId }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("[RemoveClient] API error:", data)
        toast({
          title: "Error",
          description: data.error || "Failed to remove client from database.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Success",
        description: "Client removed successfully!",
      })
      await refreshClients()
    } catch (err) {
      console.error("[RemoveClient] Network error:", err)
      toast({
        title: "Error",
        description: "Failed to remove client from database.",
        variant: "destructive",
      })
    }
  }

  const totalClientsIncome = clients.reduce((sum, client) => sum + client.totalIncome, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between glow-card backdrop-blur-sm shadow-2xl p-10 rounded-lg">
          <div>
            <h1 className="text-2xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">Manage your clients and track revenue from each source</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold drop-shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white dark:bg-transparent backdrop-blur shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Add New Client</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Enter the client information to add them to your database.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-foreground/90">Client Name *</Label>
                    <Input
                      id="clientName"
                      placeholder="Enter client name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-white/60 dark:bg-gray-800/50 border-white/40 dark:border-white/10 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientCompany" className="text-foreground/90">Company Name *</Label>
                    <Input
                      id="clientCompany"
                      placeholder="Enter company name"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      className="bg-white/60 dark:bg-gray-800/50 border-white/40 dark:border-white/10 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientDescription" className="text-foreground/90">Description</Label>
                    <Textarea
                      id="clientDescription"
                      placeholder="Enter client description (optional)"
                      value={clientDescription}
                      onChange={(e) => setClientDescription(e.target.value)}
                      rows={3}
                      className="bg-white/60 dark:bg-gray-800/50 border-white/40 dark:border-white/10 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/60"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={addClient} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md shadow-cyan-500/20">
                      Add Client
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 border-white/30 bg-white/30 dark:bg-gray-900/20 backdrop-blur hover:bg-white/40">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <MagazineCard
              title="Total Clients"
              value={clients.length}
              description="Active client relationships"
              icon={Users}
              gradient="from-blue-500 to-cyan-500"
              className="hover:scale-105 transition-all duration-300 h-full"
            />
          </div>

          <div className="flex-1">
            <MagazineCard
              title="Total Revenue"
              value={`$${totalClientsIncome.toLocaleString()}`}
              description="Revenue from all clients"
              icon={DollarSign}
              gradient="from-green-500 to-emerald-500"
              className="hover:scale-105 transition-all duration-300 h-full"
            />
          </div>

          <div className="flex-1">
            <MagazineCard
              title="Average per Client"
              value={`$${clients.length > 0 ? Math.round(totalClientsIncome / clients.length).toLocaleString() : 0}`}
              description="Average revenue per client"
              icon={DollarSign}
              gradient="from-purple-500 to-pink-500"
              className="hover:scale-105 transition-all duration-300 h-full"
            />
          </div>
        </div>

        {/* Clients List */}
        <Card className="glow-card backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>View and manage your client database</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first client to track revenue and manage relationships.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-bg text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Client
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="backdrop-blur-sm flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{client.name}</h3>
                        <span className="text-sm text-muted-foreground">at {client.company}</span>
                      </div>
                      {client.description && <p className="text-sm text-muted-foreground mb-2">{client.description}</p>}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Added {new Date(client.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium text-green-600">
                          Total Revenue: ${((client.totalIncome ?? 0).toLocaleString())}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeClient(client.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ClientsPage
