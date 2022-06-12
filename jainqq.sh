for i in {1..324}; do echo $i; curl "https://jainqq.org/_next/data/IkRKN-EK5HJsWfnOwjWsA/explore/001450/$i.json?srno=001450&pageno=$i" >> jainqq.json; echo "" >> jainqq.json; sleep 1; done
cat jainqq.json | jql '"pageProps"."pageText"' > jainqq.md
