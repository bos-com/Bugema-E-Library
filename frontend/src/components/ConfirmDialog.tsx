import { X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
}: ConfirmDialogProps) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    <p className="text-slate-300 leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-slate-900/50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDangerous
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
