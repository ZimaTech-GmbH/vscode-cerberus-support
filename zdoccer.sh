#!/bin/sh

# ZimaTech source doccer, short zdoccer, MIT licensed

# This .sh file is independent of the project it's placed in. And therefore, the
# project's license doesn't apply. On the other hand, this .sh file's license
# does not cover the project it's placed in. The license for this file is:

# zdoccer.sh
# Copyright 2020 ZimaTech GmbH, Switzerland
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# grep recursively for files containing zdoc-comments and pass filenames to sed
grep -r -l '/*zdoc\|//zdoc' src | sort -n | xargs sed -n -r '
# /*zdoc marks zdoc-block start
'/[/][*]zdoc/' {
  # init hold space with rest of line
  s/\s*[/][*]zdoc\s*//
  h
  # start doc with horizontal line
  a\
---
  # inside zdoc, repeat:
  :eatdoc
  # next line
  n
  # ...repeat until zdoc*/, which marks mdoc-block end
  '/zdoc[*][/]/' !{
    # append to hold buffer
    H
    # goto :eatdoc
    b eatdoc
  }
  # did match */, next line
  n
  # remove trailing ; and { + whitespace
  s/[;\{]\s*$//
  # remove trailing whitespace
  s/\s*$//
  # enclose it nicely in `
  s/(.+)/`\1`/
  p
  # and append hold buffer
  x
  p
  # append empty line to force line break
  a\

}
# //zdoc marks zdoc-line
'/[/][/]zdoc/' {
  # init hold space with rest of line
  s/\s*[/][/]zdoc\s*//
  h
  # start doc with horizontal line
  a\
---
  # next line
  n
  # remove trailing ; and { + whitespace
  s/[;\{]\s*$//
  # remove trailing whitespace
  s/\s*$//
  # enclose it nicely in ` and append line break
  s/(.+)/`\1`\n/
  p
  # and append hold buffer
  x
  p
  # append empty line to force line break
  a\

}
' > README.project.md

echo 'this file was auto-generated with `zdoccer.sh`' > README.md
cat README.preamble.md README.project.md README.termination.md >> README.md
rm README.project.md