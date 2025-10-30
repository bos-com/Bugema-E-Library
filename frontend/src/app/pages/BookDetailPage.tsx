import { useParams, useNavigate } from "react-router-dom";
import { Heart, Bookmark, Play, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import {
	useBook,
	useToggleLike,
	useToggleBookmark,
	useReadToken,
} from "@/lib/api/catalog";
import { useAuthStore } from "@/lib/store/auth";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import toast from "react-hot-toast";

export default function BookDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { isAuthenticated } = useAuthStore();

	const { data: book, isLoading } = useBook(id!);
	const toggleLikeMutation = useToggleLike();
	const toggleBookmarkMutation = useToggleBookmark();
	const readTokenMutation = useReadToken();

	const handleLike = async () => {
		if (!isAuthenticated) {
			toast.error("Please login to like books");
			return;
		}
		try {
			await toggleLikeMutation.mutateAsync(id!);
		} catch (error) {
			toast.error("Failed to update like status");
		}
	};

	const handleBookmark = async () => {
		if (!isAuthenticated) {
			toast.error("Please login to bookmark books");
			return;
		}
		try {
			await toggleBookmarkMutation.mutateAsync({
				bookId: id!,
				location: "0",
			});
		} catch (error) {
			toast.error("Failed to update bookmark status");
		}
	};

	const handleRead = async () => {
		if (!isAuthenticated) {
			toast.error("Please login to read books");
			return;
		}
		try {
			const token = await readTokenMutation.mutateAsync(id!);
			navigate(`/book/${id}/read?token=${token}`);
		} catch (error) {
			toast.error("Failed to get reading access");
		}
	};

	if (isLoading) {
		return <LoadingSpinner size="lg" />;
	}

	if (!book) {
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<h1 className="text-2xl font-bold mb-4">Book not found</h1>
				<Button onClick={() => navigate("/catalog")}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back to Catalog
				</Button>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<Button
				variant="ghost"
				onClick={() => navigate(-1)}
				className="mb-6"
			>
				<ArrowLeft className="h-4 w-4 mr-2" />
				Back
			</Button>

			<div className="grid lg:grid-cols-3 gap-8">
				{/* Book Cover */}
				<div className="lg:col-span-1">
					<Card>
						<div className="aspect-[3/4] bg-muted rounded-t-lg flex items-center justify-center">
							{book.cover_image ? (
								<img
									src={`/api/catalog/books/${book.id}/cover/`}
									alt={book.title}
									className="w-full h-full object-cover rounded-t-lg"
								/>
							) : (
								<div className="text-muted-foreground text-center">
									<div className="text-6xl mb-4">📚</div>
									<div className="text-lg">
										No Cover Available
									</div>
								</div>
							)}
						</div>
						<CardContent className="p-6">
							<div className="flex gap-2 mb-4">
								<Button
									variant={
										book.is_liked ? "default" : "outline"
									}
									size="sm"
									onClick={handleLike}
									disabled={toggleLikeMutation.isPending}
									className="flex-1"
								>
									<Heart
										className={`h-4 w-4 mr-2 ${
											book.is_liked ? "fill-current" : ""
										}`}
									/>
									{book.like_count}
								</Button>
								<Button
									variant={
										book.is_bookmarked
											? "default"
											: "outline"
									}
									size="sm"
									onClick={handleBookmark}
									disabled={toggleBookmarkMutation.isPending}
									className="flex-1"
								>
									<Bookmark
										className={`h-4 w-4 mr-2 ${
											book.is_bookmarked
												? "fill-current"
												: ""
										}`}
									/>
									{book.bookmark_count}
								</Button>
							</div>
							<Button
								onClick={handleRead}
								disabled={readTokenMutation.isPending}
								className="w-full"
								size="lg"
							>
								<Play className="h-4 w-4 mr-2" />
								{readTokenMutation.isPending
									? "Loading..."
									: "Read Now"}
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Book Details */}
				<div className="lg:col-span-2">
					<div className="space-y-6">
						<div>
							<h1 className="text-3xl font-bold mb-2">
								{book.title}
							</h1>
							<p className="text-xl text-muted-foreground mb-4">
								by {book.author}
							</p>

							<div className="flex flex-wrap gap-2 mb-4">
								{book.categories.map((category) => (
									<span
										key={category.id}
										className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
									>
										{category.name}
									</span>
								))}
							</div>

							<div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
								<span>Published: {book.year}</span>
								<span>Pages: {book.pages}</span>
								<span>Language: {book.language}</span>
								<span>Format: {book.file_type}</span>
								{book.isbn && <span>ISBN: {book.isbn}</span>}
							</div>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Description</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground leading-relaxed">
									{book.description ||
										"No description available."}
								</p>
							</CardContent>
						</Card>

						{book.tags.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Tags</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2">
										{book.tags.map((tag, index) => (
											<span
												key={index}
												className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm"
											>
												#{tag}
											</span>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						<Card>
							<CardHeader>
								<CardTitle>Statistics</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
									<div>
										<div className="text-2xl font-bold text-primary">
											{book.view_count}
										</div>
										<div className="text-sm text-muted-foreground">
											Views
										</div>
									</div>
									<div>
										<div className="text-2xl font-bold text-primary">
											{book.like_count}
										</div>
										<div className="text-sm text-muted-foreground">
											Likes
										</div>
									</div>
									<div>
										<div className="text-2xl font-bold text-primary">
											{book.bookmark_count}
										</div>
										<div className="text-sm text-muted-foreground">
											Bookmarks
										</div>
									</div>
									<div>
										<div className="text-2xl font-bold text-primary">
											{book.reading_progress
												? `${Math.round(
														book.reading_progress
															.percent
												  )}%`
												: "0%"}
										</div>
										<div className="text-sm text-muted-foreground">
											Progress
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
