import { Button } from '@repo/ui';

function App() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
			<h1 className="text-3xl font-semibold tracking-tight">EduCore Staff</h1>
			<div className="flex gap-2">
				<Button>Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="destructive">Destructive</Button>
			</div>
		</div>
	);
}

export default App;
