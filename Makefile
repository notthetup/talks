.PHONY: clean

index.html: README.md
	generate-md --layout jasonm23-swiss --input README.md --output .
	mv README.html index.html

clean:
	rm -rf index.html
