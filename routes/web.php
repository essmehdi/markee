<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return view('index');
});

Route::prefix("editor") -> group(function () {
    Route::get("/", function () {
				return Inertia::render("Editor");
    });
});
