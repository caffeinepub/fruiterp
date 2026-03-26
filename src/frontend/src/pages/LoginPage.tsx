import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Leaf, Loader2 } from "lucide-react";
import { useState } from "react";
import type { SessionToken } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

interface LoginPageProps {
  onLogin: (token: SessionToken) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { actor } = useAppContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const result = await actor.login(username, password);
      if (result) {
        onLogin(result);
      } else {
        setError("Invalid username or password.");
      }
    } catch (_err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.18_0.055_145)] to-[oklch(0.28_0.07_145)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4">
            <Leaf size={28} className="text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            FruitERP
          </h1>
          <p className="text-white/60 mt-1 text-sm">
            Fruit Business Management System
          </p>
        </div>
        <Card className="shadow-2xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  data-ocid="login.input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  data-ocid="login.password.input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              {error && (
                <div
                  data-ocid="login.error_state"
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
                >
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}
              <Button
                data-ocid="login.submit_button"
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Admin username:{" "}
                <span className="font-mono font-semibold text-foreground">
                  admin
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
