docker run -d --rm -it -v $(pwd)/tileserver-data:/data -p 8080:8080 maptiler/tileserver-gl:latest
npm run dev &

wait
