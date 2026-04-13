<?php

namespace App\Http\Controllers;

use App\Models\KnowledgeBase;
use Illuminate\Http\Request;

class KnowledgeBaseController extends Controller
{
    public function index()
    {
        return response()->json(['entries' => KnowledgeBase::orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $request->validate(['question' => 'required|string', 'answer' => 'required|string']);

        $entry = KnowledgeBase::create([
            'title'    => $request->question,
            'content'  => $request->answer,
            'category' => $request->category,
            'metadata' => $request->metadata ?? [],
        ]);

        return response()->json(['success' => true, 'entry' => $entry], 201);
    }

    public function show(string $id)
    {
        return response()->json(['entry' => KnowledgeBase::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $entry = KnowledgeBase::findOrFail($id);
        $entry->update(array_filter($request->only(['title', 'content', 'category', 'metadata'])));
        return response()->json(['success' => true, 'entry' => $entry]);
    }

    public function destroy(string $id)
    {
        KnowledgeBase::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
