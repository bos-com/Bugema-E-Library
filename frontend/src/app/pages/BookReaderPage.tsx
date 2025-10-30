import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ZoomIn,
	ZoomOut,
	RotateCcw,
	Settings,
	BookOpen,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useBook } from "@/lib/api/catalog";
import { useUpdateProgress } from "@/lib/api/reading";
import { useAuthStore } from "@/lib/store/auth";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import toast from "react-hot-toast";

export default function BookReaderPage() {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { user } = useAuthStore();

	const token = searchParams.get("token");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [zoom, setZoom] = useState(100);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { data: book } = useBook(id!);
	const updateProgressMutation = useUpdateProgress();

	// Debounced progress update
	useEffect(() => {
		if (totalPages > 0 && currentPage > 0) {
			const timeoutId = setTimeout(() => {
				const percent = (currentPage / totalPages) * 100;
				updateProgressMutation.mutate({
					bookId: id!,
					location: currentPage.toString(),
					percent,
					timeSpent: 0, // This would be calculated based on reading time
				});
			}, 2000); // Update every 2 seconds

			return () => clearTimeout(timeoutId);
		}
	}, [currentPage, totalPages, id, updateProgressMutation]);

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	const handleZoom = (direction: "in" | "out") => {
		if (direction === "in" && zoom < 200) {
			setZoom(zoom + 25);
		} else if (direction === "out" && zoom > 50) {
			setZoom(zoom - 25);
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		switch (e.key) {
			case "ArrowLeft":
				handlePageChange(currentPage - 1);
				break;
			case "ArrowRight":
				handlePageChange(currentPage + 1);
				break;
			case "Escape":
				navigate(`/book/${id}`);
				break;
		}
	};

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [currentPage, totalPages]);

	// Disable right-click and other shortcuts
	useEffect(() => {
		const handleContextMenu = (e: MouseEvent) => e.preventDefault();
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
				e.preventDefault();
			}
		};

		document.addEventListener("contextmenu", handleContextMenu);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	if (!token) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Access Denied</h1>
					<p className="text-muted-foreground mb-4">
						You need a valid token to read this book.
					</p>
					<Button onClick={() => navigate(`/book/${id}`)}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Book
					</Button>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">
						Error Loading Book
					</h1>
					<p className="text-muted-foreground mb-4">{error}</p>
					<Button onClick={() => navigate(`/book/${id}`)}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Book
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
				<div className="flex items-center justify-between p-4">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => navigate(`/book/${id}`)}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back
						</Button>
						<div>
							<h1 className="font-semibold">{book?.title}</h1>
							<p className="text-sm text-muted-foreground">
								{book?.author}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleZoom("out")}
							disabled={zoom <= 50}
						>
							<ZoomOut className="h-4 w-4" />
						</Button>
						<span className="text-sm text-muted-foreground min-w-[3rem] text-center">
							{zoom}%
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleZoom("in")}
							disabled={zoom >= 200}
						>
							<ZoomIn className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setZoom(100)}
						>
							<RotateCcw className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="px-4 pb-2">
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span>
							Page {currentPage} of {totalPages}
						</span>
						<div className="flex-1 bg-muted rounded-full h-2">
							<div
								className="bg-primary h-2 rounded-full transition-all duration-300"
								style={{
									width: `${
										(currentPage / totalPages) * 100
									}%`,
								}}
							/>
						</div>
						<span>
							{Math.round((currentPage / totalPages) * 100)}%
						</span>
					</div>
				</div>
			</div>

			{/* Reader Content */}
			<div className="flex-1 p-4">
				<div className="max-w-4xl mx-auto">
					{book?.file_type === "PDF" ? (
						<div
							className="pdf-reader"
							data-watermark={user?.email}
						>
							<div className="text-center py-20">
								<BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h2 className="text-xl font-semibold mb-2">
									PDF Reader
								</h2>
								<p className="text-muted-foreground mb-4">
									PDF reading functionality would be
									implemented here using react-pdf
								</p>
								<p className="text-sm text-muted-foreground">
									Book: {book.title} | Author: {book.author}
								</p>
							</div>
						</div>
					) : (
						<div
							className="epub-reader"
							data-watermark={user?.email}
						>
							<div className="text-center py-20">
								<BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h2 className="text-xl font-semibold mb-2">
									EPUB Reader
								</h2>
								<p className="text-muted-foreground mb-4">
									EPUB reading functionality would be
									implemented here using epubjs
								</p>
								<p className="text-sm text-muted-foreground">
									Book: {book?.title} | Author: {book?.author}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Navigation */}
			<div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<Button
						variant="outline"
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage <= 1}
					>
						Previous
					</Button>

					<div className="flex items-center gap-2">
						<input
							type="number"
							value={currentPage}
							onChange={(e) => {
								const page = parseInt(e.target.value);
								if (page >= 1 && page <= totalPages) {
									setCurrentPage(page);
								}
							}}
							className="w-20 px-2 py-1 border border-input rounded text-center"
							min="1"
							max={totalPages}
						/>
						<span className="text-sm text-muted-foreground">
							of {totalPages}
						</span>
					</div>

					<Button
						variant="outline"
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage >= totalPages}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
