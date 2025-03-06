
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const AuthStatus = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {user && (
        <>
          <span className="text-sm text-muted-foreground">
            {user.email}
          </span>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </>
      )}
    </div>
  );
};

export default AuthStatus;
