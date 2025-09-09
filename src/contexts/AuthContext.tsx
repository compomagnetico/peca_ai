"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Profile = {
  id: string;
  username: string | null;
};

type Settings = {
  workshop_name: string | null;
  logo_url: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  settings: Settings | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching user profile:", profileError);
      } else {
        setProfile(profileData as Profile);
      }

      const { data: settingsData, error: settingsError } = await supabase
        .from("settings")
        .select("workshop_name, logo_url")
        .eq("user_id", userId)
        .single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching user settings:", settingsError);
      } else {
        setSettings(settingsData as Settings);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserData(currentUser.id);
        } else {
          setProfile(null);
          setSettings(null);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      const initialUser = initialSession?.user ?? null;
      setUser(initialUser);
      if (initialUser) {
        await fetchUserData(initialUser.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSettings(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, settings, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};