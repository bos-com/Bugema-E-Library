import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { useCategories } from "@/lib/api/catalog";

export default function AdminCategoriesPage() {
	const { data: categories, isLoading } = useCategories();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">
						Categories Management
					</h1>
					<p className="text-muted-foreground">
						Manage book categories and genres
					</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Add Category
				</Button>
			</div>

			{/* Categories Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{isLoading ? (
					[...Array(6)].map((_, i) => (
						<Card key={i} className="animate-pulse">
							<CardContent className="p-6">
								<div className="h-4 bg-muted rounded mb-2" />
								<div className="h-3 bg-muted rounded w-2/3 mb-4" />
								<div className="h-3 bg-muted rounded w-1/3" />
							</CardContent>
						</Card>
					))
				) : categories?.length ? (
					categories.map((category) => (
						<Card
							key={category.id}
							className="hover:shadow-lg transition-shadow"
						>
							<CardContent className="p-6">
								<div className="flex items-start justify-between mb-4">
									<div>
										<h3 className="font-semibold text-lg">
											{category.name}
										</h3>
										<p className="text-sm text-muted-foreground">
											{category.slug}
										</p>
									</div>
									<div className="flex items-center space-x-1">
										<Button variant="outline" size="sm">
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{category.description && (
									<p className="text-sm text-muted-foreground mb-4 line-clamp-2">
										{category.description}
									</p>
								)}

								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{category.book_count} books
									</span>
									<span className="text-muted-foreground">
										Created{" "}
										{new Date(
											category.created_at
										).toLocaleDateString()}
									</span>
								</div>
							</CardContent>
						</Card>
					))
				) : (
					<div className="col-span-full text-center py-12">
						<div className="text-6xl mb-4">📂</div>
						<h3 className="text-xl font-semibold mb-2">
							No categories found
						</h3>
						<p className="text-muted-foreground mb-4">
							Get started by creating your first category
						</p>
						<Button>
							<Plus className="h-4 w-4 mr-2" />
							Add Category
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
