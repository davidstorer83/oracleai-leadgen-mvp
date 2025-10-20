#!/usr/bin/env python3
"""
yt-dlp transcript extraction script for Node.js integration
"""

import sys
import json
import yt_dlp
import os
import tempfile
from pathlib import Path

def get_video_transcript(video_url):
    """
    Extract transcript from YouTube video using yt-dlp
    """
    try:
        # Create temporary directory for subtitles
        with tempfile.TemporaryDirectory() as temp_dir:
            ydl_opts = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': ['en', 'en-US', 'en-GB'],
                'skip_download': True,
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extract info without downloading
                info = ydl.extract_info(video_url, download=False)
                
                if not info:
                    return None
                
                # Try to get subtitles
                subtitles = {}
                
                # Check for automatic captions
                if 'automatic_captions' in info and info['automatic_captions']:
                    for lang, formats in info['automatic_captions'].items():
                        if lang.startswith('en'):
                            subtitles[lang] = formats
                
                # Check for manual subtitles
                if 'subtitles' in info and info['subtitles']:
                    for lang, formats in info['subtitles'].items():
                        if lang.startswith('en'):
                            subtitles[lang] = formats
                
                if not subtitles:
                    return None
                
                # Get the best English subtitle
                best_subtitle = None
                for lang in ['en-US', 'en-GB', 'en']:
                    if lang in subtitles and subtitles[lang]:
                        best_subtitle = subtitles[lang][0]  # Take the first format
                        break
                
                if not best_subtitle:
                    return None
                
                # Download the subtitle file
                subtitle_url = best_subtitle['url']
                subtitle_ext = best_subtitle['ext']
                
                # Use yt-dlp to download the subtitle
                subtitle_lang = best_subtitle.get('language', 'en')
                subtitle_opts = {
                    'writesubtitles': True,
                    'writeautomaticsub': True,
                    'subtitleslangs': [subtitle_lang],
                    'skip_download': True,
                    'outtmpl': os.path.join(temp_dir, 'subtitle.%(ext)s'),
                    'quiet': True,
                    'no_warnings': True,
                }
                
                with yt_dlp.YoutubeDL(subtitle_opts) as ydl_sub:
                    ydl_sub.download([video_url])
                
                # Find the downloaded subtitle file
                subtitle_files = list(Path(temp_dir).glob('subtitle.*'))
                if not subtitle_files:
                    return None
                
                subtitle_file = subtitle_files[0]
                
                # Read and parse the subtitle file
                transcript_text = ""
                
                if subtitle_file.suffix == '.vtt':
                    # Parse VTT format
                    with open(subtitle_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Simple VTT parsing - extract text between timestamps
                    lines = content.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and not line.startswith('WEBVTT') and not line.startswith('NOTE') and not '-->' in line and not line.isdigit():
                            # Clean up VTT formatting
                            clean_line = line.replace('<c>', '').replace('</c>', '')
                            clean_line = clean_line.replace('<c.', '').replace('>', '')
                            if clean_line:
                                transcript_text += clean_line + " "
                
                elif subtitle_file.suffix == '.srt':
                    # Parse SRT format
                    with open(subtitle_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Simple SRT parsing
                    lines = content.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and not line.isdigit() and not '-->' in line:
                            transcript_text += line + " "
                
                elif subtitle_file.suffix == '.json':
                    # Parse JSON format
                    with open(subtitle_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    if 'events' in data:
                        for event in data['events']:
                            if 'segs' in event:
                                for seg in event['segs']:
                                    if 'utf8' in seg:
                                        transcript_text += seg['utf8'] + " "
                
                # Clean up the transcript
                transcript_text = transcript_text.strip()
                transcript_text = ' '.join(transcript_text.split())  # Remove extra whitespace
                
                return {
                    'success': True,
                    'transcript': transcript_text,
                    'language': best_subtitle.get('language', 'unknown'),
                    'format': subtitle_ext,
                    'video_title': info.get('title', ''),
                    'video_id': info.get('id', ''),
                    'duration': info.get('duration', 0)
                }
                
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'transcript': None
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python yt_dlp_transcript.py <video_url>',
            'transcript': None
        }))
        sys.exit(1)
    
    video_url = sys.argv[1]
    result = get_video_transcript(video_url)
    print(json.dumps(result))

if __name__ == '__main__':
    main()
