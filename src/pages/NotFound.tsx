import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft, Search, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(`404 Error: Attempted to access non-existent route: ${location.pathname}`);
    
    // Optionally send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to analytics
      // analytics.track('404_error', { path: location.pathname });
    }
  }, [location.pathname]);

  // Extract potential intended route from common typos
  const getSuggestedRoute = () => {
    const path = location.pathname.toLowerCase();
    
    // Common redirect suggestions
    if (path.includes('dashbaord')) return '/dashboard';
    if (path.includes('studdy')) return '/study';
    if (path.includes('profilee')) return '/profile';
    if (path.includes('leaderbord')) return '/leaderboard';
    if (path.includes('setings')) return '/settings';
    
    // Check for plural/singular mismatches
    if (path.endsWith('s') && path.length > 2) {
      const singular = path.slice(0, -1);
      return singular;
    }
    
    return null;
  };

  const suggestedRoute = getSuggestedRoute();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTrySuggested = () => {
    if (suggestedRoute) {
      navigate(suggestedRoute);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-destructive/20 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {/* Animated Icon */}
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              className="mb-6 inline-flex items-center justify-center rounded-full bg-destructive/10 p-4"
            >
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </motion.div>

            {/* Error Code */}
            <motion.h1 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="mb-2 font-mono text-6xl font-bold tracking-tighter text-foreground"
            >
              404
            </motion.h1>

            {/* Main Message */}
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Page Not Found
            </h2>

            {/* Error Details */}
            <div className="mb-6 space-y-3">
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
              
              <div className="rounded-lg bg-muted/50 p-3 font-mono text-sm">
                <code className="break-all text-muted-foreground">
                  {location.pathname}
                </code>
              </div>

              {/* Suggested Route */}
              {suggestedRoute && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg bg-primary/10 p-3"
                >
                  <p className="text-sm text-primary">
                    <Search className="mr-2 inline h-4 w-4" />
                    Did you mean:{' '}
                    <button
                      onClick={handleTrySuggested}
                      className="font-semibold underline hover:text-primary/80"
                    >
                      {suggestedRoute}
                    </button>
                    ?
                  </p>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="h-auto flex-col gap-2 py-3"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs">Go Back</span>
              </Button>

              <Button
                onClick={handleGoHome}
                className="h-auto flex-col gap-2 py-3"
              >
                <Home className="h-4 w-4" />
                <span className="text-xs">Home</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleRefresh}
                className="h-auto flex-col gap-2 py-3"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Refresh</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="h-auto flex-col gap-2 py-3"
              >
                <span className="text-xs">Dashboard</span>
              </Button>
            </div>

            {/* Additional Help */}
            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Need help? Contact support or check our{' '}
                <a
                  href="/help"
                  className="font-medium text-primary underline hover:text-primary/80"
                >
                  help center
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Optional: Easter Egg or Fun Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-muted-foreground">
            🚀 Study smarter, not harder! Even lost pages can't stop your progress.
          </p>
        </motion.div>
      </motion.div>

      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-4 bottom-1/4 h-72 w-72 rounded-full bg-destructive/5 blur-3xl" />
      </div>
    </div>
  );
};

export default NotFound;