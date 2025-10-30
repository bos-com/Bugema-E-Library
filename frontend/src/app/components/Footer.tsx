import { BookOpen, Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
	return (
		<footer className="bg-muted/50 border-t">
			<div className="container mx-auto px-4 py-8">
				<div className="grid md:grid-cols-4 gap-8">
					{/* Logo and Description */}
					<div className="space-y-4">
						<div className="flex items-center space-x-2">
							<BookOpen className="h-6 w-6 text-primary" />
							<span className="text-xl font-bold">E-Library</span>
						</div>
						<p className="text-sm text-muted-foreground">
							Your digital library for discovering, reading, and
							enjoying books online.
						</p>
					</div>

					{/* Quick Links */}
					<div className="space-y-4">
						<h3 className="font-semibold">Quick Links</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href="/catalog"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Browse Catalog
								</a>
							</li>
							<li>
								<a
									href="/dashboard"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									My Dashboard
								</a>
							</li>
							<li>
								<a
									href="/auth/login"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Sign In
								</a>
							</li>
							<li>
								<a
									href="/auth/register"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Sign Up
								</a>
							</li>
						</ul>
					</div>

					{/* Categories */}
					<div className="space-y-4">
						<h3 className="font-semibold">Categories</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href="/catalog?category=fiction"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Fiction
								</a>
							</li>
							<li>
								<a
									href="/catalog?category=non-fiction"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Non-Fiction
								</a>
							</li>
							<li>
								<a
									href="/catalog?category=technology"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Technology
								</a>
							</li>
							<li>
								<a
									href="/catalog?category=biography"
									className="text-muted-foreground hover:text-primary transition-colors"
								>
									Biography
								</a>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div className="space-y-4">
						<h3 className="font-semibold">Contact</h3>
						<div className="flex space-x-4">
							<a
								href="#"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								<Github className="h-5 w-5" />
							</a>
							<a
								href="#"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								<Twitter className="h-5 w-5" />
							</a>
							<a
								href="#"
								className="text-muted-foreground hover:text-primary transition-colors"
							>
								<Mail className="h-5 w-5" />
							</a>
						</div>
						<p className="text-sm text-muted-foreground">
							support@elibrary.com
						</p>
					</div>
				</div>

				<div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
					<p>&copy; 2024 E-Library. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}
