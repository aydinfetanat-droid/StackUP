import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { logEvent } from "../lib/analytics";
import type { Profile } from "../types/profile";

// Fallback used only if a user somehow reaches ensureProfile without the
// display_name/school metadata that signUp attaches (shouldn't normally happen).
const FALLBACK_DISPLAY_NAME = "Student";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, school: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Creates the profile row on first authenticated load if it doesn't exist yet.
  // Signup can't insert the profile directly because if the Supabase project
  // requires email confirmation, signUp() returns no active session (so the
  // insert would run as the anonymous role and get rejected). Stashing
  // display_name/school in auth user_metadata at signup time and creating the
  // profile lazily here means the app works correctly whether or not email
  // confirmation is enabled.
  const ensureProfile = useCallback(async (user: User) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      return;
    }
    if (error) return;

    const displayName = (user.user_metadata?.display_name as string | undefined) ?? FALLBACK_DISPLAY_NAME;
    const school = (user.user_metadata?.school as string | undefined) ?? "Other";

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, display_name: displayName, school, xp: 0 })
      .select("*")
      .single();

    if (!insertError && created) {
      setProfile(created as Profile);
      await logEvent("signup", { school });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) ensureProfile(session.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        ensureProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [ensureProfile]);

  const signUp = async (email: string, password: string, displayName: string, school: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, school } },
    });
    if (error) return { error: error.message };

    if (!data.session) {
      return { error: "Check your email to confirm your account, then log in." };
    }

    await ensureProfile(data.session.user);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await logEvent("login");
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session?.user) await ensureProfile(session.user);
  };

  const addXp = async (amount: number) => {
    if (!session?.user || !profile) return;
    const newXp = profile.xp + amount;
    const { error } = await supabase.from("profiles").update({ xp: newXp }).eq("id", session.user.id);
    if (!error) setProfile({ ...profile, xp: newXp });
  };

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    addXp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
