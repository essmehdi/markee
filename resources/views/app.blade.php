<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
	<title>{{ $title ?? "Dawwin" }}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
	<link
		rel="stylesheet"
		type="text/css"
		href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css"
	/>
	<script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>
	@viteReactRefresh
	@vite(["resources/css/app.css", "resources/ts/inertia-bootstrap.tsx"])
    @inertiaHead
  </head>
  <body>
    @inertia
  </body>
</html>
