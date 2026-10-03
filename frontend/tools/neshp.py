"""Lector mínimo (solo librería estándar) de shapefiles de polígonos + dbf de Natural Earth."""
import struct

def read_dbf(path):
    with open(path, 'rb') as f:
        h = f.read(32)
        n, hlen, rlen = struct.unpack('<IHH', h[4:12])
        fields = []
        while True:
            d = f.read(32)
            if d[0] == 0x0D: break
            fields.append((d[:11].split(b'\0')[0].decode('ascii'), d[16]))
        f.seek(hlen)
        recs = []
        for _ in range(n):
            r = f.read(rlen)
            if not r: break
            pos = 1; row = {}
            for name, ln in fields:
                row[name] = r[pos:pos+ln].decode("utf-8", "replace").replace("\x00", "").strip(); pos += ln
            recs.append(row)
    return recs

def read_shp(path):
    """-> lista de listas de anillos [(x,y),...] por registro."""
    out = []
    with open(path, 'rb') as f:
        f.read(100)
        while True:
            hd = f.read(8)
            if len(hd) < 8: break
            _, clen = struct.unpack('>ii', hd)
            c = f.read(clen * 2)
            t = struct.unpack('<i', c[:4])[0]
            if t == 0: out.append([]); continue
            npart, npts = struct.unpack('<ii', c[36:44])
            parts = list(struct.unpack('<%di' % npart, c[44:44+4*npart])) + [npts]
            o = 44 + 4*npart
            pts = struct.unpack('<%dd' % (2*npts), c[o:o+16*npts])
            P = list(zip(pts[0::2], pts[1::2]))
            out.append([P[a:b] for a, b in zip(parts, parts[1:])])
    return out
