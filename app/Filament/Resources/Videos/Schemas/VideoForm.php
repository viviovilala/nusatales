<?php

namespace App\Filament\Resources\Videos\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;
use Filament\Forms\Components\TextInput;

class VideoForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('judul')
                    ->required(),
                Textarea::make('deskripsi')
                    ->columnSpanFull(),
                TextInput::make('durasi')
                    ->required()
                    ->numeric(),
                FileUpload::make('url_video')
                    ->label('Video file')
                    ->disk('public')
                    ->directory('videos')
                    ->acceptedFileTypes(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'])
                    ->maxSize(102400)
                    ->required(),
                FileUpload::make('thumbnail')
                    ->disk('public')
                    ->directory('thumbnails')
                    ->image()
                    ->imageEditor(),
                Select::make('status')
                    ->options(['draft' => 'Draft', 'published' => 'Published', 'rejected' => 'Rejected'])
                    ->default('draft')
                    ->required(),
                Textarea::make('rejection_reason')
                    ->columnSpanFull(),
                DateTimePicker::make('tanggal_upload')
                    ->default(now())
                    ->required(),
                Select::make('kreator_id')
                    ->relationship('creator', 'nama')
                    ->searchable()
                    ->preload()
                    ->required(),
                Select::make('kategori_id')
                    ->relationship('category', 'nama_kategori')
                    ->searchable()
                    ->preload(),
                Select::make('cerita_id')
                    ->relationship('story', 'judul_cerita')
                    ->searchable()
                    ->preload(),
            ]);
    }
}
