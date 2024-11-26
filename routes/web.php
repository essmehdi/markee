<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('index');
});

Route::prefix("editor") -> group(function () {
    Route::get("/", function () {
        return view("editor");
    });
});
