import re

def _extract_at_blocks(css, prefix):
    """Pull out top-level @keyframes blocks (brace-matched) so they stay global."""
    out, rest, i = [], [], 0
    while i < len(css):
        j = css.find(prefix, i)
        if j == -1:
            rest.append(css[i:]); break
        rest.append(css[i:j])
        k = css.find('{', j); depth = 1; k += 1
        while depth and k < len(css):
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        out.append(css[j:k]); i = k
    return ''.join(rest), out

def scope(css, wrapper):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css, keyframes = _extract_at_blocks(css, '@keyframes')
    css = re.sub(r':root\s*\{', '&{', css)
    css = re.sub(r'html\s*,\s*body\s*\{', '&{', css)
    css = re.sub(r'(^|\})\s*html\s*\{', r'\1 &{', css)
    css = re.sub(r'(^|\})\s*body\s*\{', r'\1 &{', css)
    return '\n'.join(keyframes) + f'\n.{wrapper}{{\n{css}\n}}\n'
