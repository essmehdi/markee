<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>{{ $title ?? "Dawwin" }}</title>

				<!-- Phosphor Icons -->
				<link
					rel="stylesheet"
					type="text/css"
					href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css"
				/>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Styles / Scripts -->
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css'])
        @endif

				{{ $head ?? "" }}
    </head>
    <body {{ $attributes -> class(["font-sans"]) }}>
				{{ $slot }}
				{{ $postScripts ?? "" }}
		</body>
</html>
