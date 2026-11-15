import re, sys
for f in ['site/index.html', 'site/works/index.html']:
    s = open(f, encoding='utf-8').read()
    for key in ['Pioneering Projects', 'Collection of Our Works']:
        i = s.find(key)
        print('=====', f, key, len(s), i)
        if i >= 0:
            print(s[max(0, i-2500):i+400].replace('\\n', ' ')[:3000])
