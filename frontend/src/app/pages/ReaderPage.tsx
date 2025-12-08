import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { getBookDetail, streamBookContent } from "../../lib/api/catalog";
import {
	getOrCreateSession,
	updateSessionProgress,
	endSession,
} from "../../lib/api/reading";
import {
	getHighlights,
	createHighlight,
	deleteHighlight,
} from "../../lib/api/highlights";
import LoadingOverlay from "../../components/feedback/LoadingOverlay";
import PDFViewer from "../../components/reader/PDFViewer";
import SubscriptionRequiredPage from "./subscription/SubscriptionRequiredPage";
import RenewalNotification from "../../components/subscription/RenewalNotification";
import { useSubscription } from "../../lib/hooks/useSubscription";
import type { Highlight } from "../../lib/types";

const ReaderPage = () => {
	const { bookId } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [isSessionActive, setIsSessionActive] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const sessionStartTime = useRef<number>(Date.now());
	const updateTimeoutRef = useRef<number | null>(null);
	const sessionIdRef = useRef<string | null>(null);

	// Subscription check for visitors - CHECK FIRST before loading anything
	const {
		needsSubscription,
		showRenewalWarning,
		expiryDate,
		isLoading: subscriptionLoading,
	} = useSubscription();

	// Get book title for subscription page
	const { data: book, isLoading: bookLoading } = useQuery({
		queryKey: ["book", bookId],
		queryFn: () => getBookDetail(bookId!),
		enabled: Boolean(bookId),
	});

	// Only fetch book content if subscription is valid
	const {
		data: fileUrl,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["book-stream", bookId],
		queryFn: () => streamBookContent(bookId!),
		enabled: Boolean(bookId) && !needsSubscription && !subscriptionLoading,
		staleTime: Infinity,
		retry: 2,
	});

	// Fetch highlights for this book
	const { data: highlights = [] } = useQuery({
		queryKey: ["highlights", bookId],
		queryFn: () => getHighlights(bookId!),
		enabled: Boolean(bookId),
	});

	// Mutation for creating highlights
	const createHighlightMutation = useMutation({
		mutationFn: (
			highlight: Omit<
				Highlight,
				"id" | "book" | "created_at" | "updated_at"
			>
		) => createHighlight(bookId!, highlight),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["highlights", bookId] });
		},
	});

	// Mutation for deleting highlights
	const deleteHighlightMutation = useMutation({
		mutationFn: (highlightId: string) => deleteHighlight(highlightId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["highlights", bookId] });
		},
	});

	// Mutation for ending session
	const endSessionMutation = useMutation({
		mutationFn: async (sessionId: string) => {
			try {
				await endSession(sessionId);
			} catch (error) {
				// Ignore errors during cleanup (e.g. session already closed or 404)
				console.warn("Session cleanup warning:", error);
			}
		},
	});

	// Start reading session when component mounts
	useEffect(() => {
		if (!bookId || needsSubscription) return;

		const startSession = async () => {
			try {
				const session = await getOrCreateSession(bookId);
				const id = session.id;
				setSessionId(id);
				sessionIdRef.current = id;
				setIsSessionActive(true);
				sessionStartTime.current = Date.now();

				// If we have previous progress, set current page
				// Note: You might want to fetch the last progress location here
			} catch (error) {
				console.error("Failed to start reading session:", error);
			}
		};

		startSession();

		// Cleanup: end session when component unmounts or bookId changes
		return () => {
			if (sessionIdRef.current) {
				endSessionMutation.mutate(sessionIdRef.current);
				setIsSessionActive(false);
				sessionIdRef.current = null;
			}
		};
	}, [bookId, needsSubscription, endSessionMutation]);

	// Handle page changes and update progress
	const handlePageChange = useCallback(
		(page: number) => {
			setCurrentPage(page);

			if (!sessionId || !isSessionActive) return;

			// Debounce updates to avoid too many API calls - reduced to 500ms for better tracking
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
			}

			updateTimeoutRef.current = setTimeout(async () => {
				try {
					const percent =
						totalPages > 0 ? (page / totalPages) * 100 : 0;
					await updateSessionProgress(sessionId, {
						current_page: page,
						percent: Math.min(percent, 100),
						location: `Page ${page} of ${totalPages}`,
					});
				} catch (error) {
					console.error("Failed to update progress:", error);
				}
			}, 500); // Reduced from 1000ms to 500ms
		},
		[sessionId, isSessionActive, totalPages]
	);

	// Periodic progress updates every 30 seconds while reading
	useEffect(() => {
		if (
			!sessionId ||
			!isSessionActive ||
			totalPages === 0 ||
			needsSubscription
		)
			return;

		const interval = setInterval(async () => {
			try {
				const percent =
					totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
				await updateSessionProgress(sessionId, {
					current_page: currentPage,
					percent: Math.min(percent, 100),
					location: `Page ${currentPage} of ${totalPages}`,
				});
			} catch (error) {
				console.error("Failed to update periodic progress:", error);
			}
		}, 30000); // Every 30 seconds

		return () => clearInterval(interval);
	}, [
		sessionId,
		isSessionActive,
		currentPage,
		totalPages,
		needsSubscription,
	]);

	// Handle document load success
	const handleLoadSuccess = useCallback((numPages: number) => {
		setTotalPages(numPages);
	}, []);

	// BLOCK: If visitor needs subscription, show subscription page AFTER all hooks are called
	if (!subscriptionLoading && needsSubscription) {
		return (
			<SubscriptionRequiredPage
				actionBlocked="read"
				bookTitle={book?.title}
			/>
		);
	}

	if (isLoading || bookLoading) {
		return <LoadingOverlay label="Preparing secure reader" />;
	}

	if (isError) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
				<div className="rounded-full bg-gradient-to-br from-rose-100 to-rose-200 p-6 dark:from-rose-500/10 dark:to-rose-600/5">
					<svg
						className="h-16 w-16 text-rose-600 dark:text-rose-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div className="max-w-md">
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Failed to Load Book
					</h2>
					<p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
						{error instanceof Error
							? error.message
							: "Unable to load the book content. Please try again later."}
					</p>
				</div>
				<Link to="/catalog" className="btn-primary">
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					Back to Catalog
				</Link>
			</div>
		);
	}

	if (!fileUrl) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
				<div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
					<svg
						className="h-16 w-16 text-slate-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
				</div>
				<div>
					<p className="text-lg font-semibold text-slate-900 dark:text-white">
						No content available
					</p>
					<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
						This book doesn't have available content
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-6 animate-in px-2 md:px-0">
			{/* Header - Mobile responsive */}
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="flex-1">
					<p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">
						Reader
					</p>
					<h1 className="mt-2 text-xl md:text-3xl font-bold text-slate-900 dark:text-white line-clamp-2">
						{book?.title}
					</h1>
					<p className="mt-1 text-sm md:text-base text-slate-600 dark:text-slate-400">
						{book?.author}
					</p>

					{/* Session Status Indicator */}
					{isSessionActive && (
						<div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs md:text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
							</span>
							<span className="hidden sm:inline">
								Reading session active
							</span>
							<span className="sm:hidden">Reading</span>
							{totalPages > 0 && (
								<span className="text-emerald-600 dark:text-emerald-500">
									• {currentPage}/{totalPages}
								</span>
							)}
						</div>
					)}
				</div>

				{/* Action buttons - responsive */}
				<div className="flex items-center gap-2 md:gap-3">
					<button
						onClick={async () => {
							if (
								sessionId &&
								window.confirm(
									"Are you sure you want to mark this book as finished?"
								)
							) {
								try {
									await updateSessionProgress(sessionId, {
										percent: 100,
										current_page: totalPages,
										location: `Page ${totalPages} of ${totalPages}`,
									});
									navigate("/dashboard");
								} catch (error) {
									console.error(
										"Failed to mark as finished",
										error
									);
								}
							}
						}}
						className="inline-flex items-center gap-1 md:gap-2 rounded-xl bg-emerald-600 px-3 md:px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shrink-0"
					>
						<svg
							className="h-4 w-4 md:h-5 md:w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span className="hidden sm:inline">
							Mark as Finished
						</span>
						<span className="sm:hidden">Done</span>
					</button>
					<Link
						to={`/catalog/${bookId}`}
						className="inline-flex items-center gap-1 md:gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 md:px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-slate-800 dark:text-white shrink-0"
					>
						<svg
							className="h-4 w-4 md:h-5 md:w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span className="hidden sm:inline">Book Details</span>
						<span className="sm:hidden">Info</span>
					</Link>
				</div>
			</div>

			{/* Reader Container */}
			<PDFViewer
				fileUrl={fileUrl}
				initialPage={currentPage}
				onPageChange={handlePageChange}
				onLoadSuccess={handleLoadSuccess}
				highlights={highlights}
				onCreateHighlight={(highlight) =>
					createHighlightMutation.mutate(highlight)
				}
				onDeleteHighlight={(highlightId) =>
					deleteHighlightMutation.mutate(highlightId)
				}
				userEmail={book?.author || "user@bugema.com"}
			/>
			{/* Renewal Notification */}
			{showRenewalWarning && expiryDate && (
				<RenewalNotification expiryDate={expiryDate} />
			)}
		</div>
	);
};

export default ReaderPage;
