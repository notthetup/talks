.PHONY: clean

default:
	generate-md --layout jasonm23-swiss --input README.md --output .
	mv README.html index.html

clean:
	rm -rf README.html index.html
