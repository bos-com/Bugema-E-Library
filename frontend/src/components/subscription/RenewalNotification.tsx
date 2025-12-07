import { Link } from 'react-router-dom';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RenewalNotificationProps {
    expiryDate: Date;
    onDismiss?: () => void;
}

const RenewalNotification = ({ expiryDate, onDismiss }: RenewalNotificationProps) => {
    const [dismissed, setDismissed] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimeLeft = () => {
            const now = new Date();
            const diff = expiryDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 24) {
                const days = Math.floor(hours / 24);
                setTimeLeft(`${days} day${days > 1 ? 's' : ''}`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${minutes} minutes`);
            }
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [expiryDate]);

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    const formattedDate = expiryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-xl dark:border-amber-500/30 dark:from-amber-900/30 dark:to-orange-900/20">
            <button
                onClick={handleDismiss}
                className="absolute right-2 top-2 rounded-full p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-800/30"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                        Subscription Expiring Soon
                    </h4>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                        <Clock className="mr-1 inline h-3 w-3" />
                        <span className="font-medium">{timeLeft}</span> remaining
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                        Expires: {formattedDate}
                    </p>
                    <Link
                        to="/subscription/plans"
                        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
                    >
                        Renew Now
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RenewalNotification;
