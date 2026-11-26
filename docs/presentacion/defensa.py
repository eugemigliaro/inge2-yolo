"""Diapositivas animadas de la defensa del TPIF.

Cada clase es una diapositiva y cada `paso` espera una tecla, como en PowerPoint.
Las notas de cada paso son la frase del guion (docs/defensa.md) que la acompaña.
Para renderizar, presentar y exportar, ver presentacion.sh.
"""

import random

import numpy as np
from manim import *
from manim_slides import Slide

config.background_color = "#0E1014"

FUENTE = "CMU Serif"
MONO = "CMU Typewriter Text"
TEXTO = "#ECECEC"
GRIS = "#8F949C"
TENUE = "#3C4048"
AZUL = "#58C4DD"
AMARILLO = "#F4D345"
VERDE = "#83C167"
ROJO = "#FC6255"
VIOLETA = "#B189C6"
TEAL = "#5CD0B3"
NARANJA = "#FF9F43"
AREAS = [("Medicina", ROJO), ("Sistemas", AZUL), ("Derecho", VIOLETA)]


# ---------------------------------------------------------------- piezas


def T(s, size=30, color=TEXTO, font=FUENTE, **kw):
    return Text(s, font=font, font_size=size, color=color, **kw)


def lineas(s, size=24, color=GRIS, centrado=False, buff=None, **kw):
    """Párrafo de varias líneas, alineado a la izquierda o centrado."""
    g = VGroup(*[T(l, size, color, **kw) for l in s.split("\n")])
    return g.arrange(DOWN, buff=buff or size / 200, aligned_edge=ORIGIN if centrado else LEFT)


def caja(w, h, color=AZUL, fill=0.12, r=0.16, sw=2.5):
    return RoundedRectangle(
        width=w, height=h, corner_radius=r,
        stroke_color=color, stroke_width=sw, fill_color=color, fill_opacity=fill,
    )


def nodo(titulo, sub=None, color=AZUL, w=2.4, h=1.0, size=28, subsize=20, mono=False):
    fondo = caja(w, h, color)
    textos = VGroup(T(titulo, size, font=MONO if mono else FUENTE, weight=BOLD))
    if sub:
        textos.add(T(sub, subsize, GRIS))
    textos.arrange(DOWN, buff=0.1)
    if textos.width > w - 0.25:
        textos.scale_to_fit_width(w - 0.25)
    return VGroup(fondo, textos.move_to(fondo))


def pastilla(s, color, size=18):
    t = T(s, size, color, weight=BOLD)
    fondo = caja(t.width + 0.3, t.height + 0.2, color, fill=0.15, r=0.12, sw=1.5)
    base = caja(t.width + 0.3, t.height + 0.2, config.background_color, fill=1, r=0.12, sw=0)
    return VGroup(base, fondo, t.move_to(fondo))


def numero(n, color=AMARILLO, r=0.28, size=26):
    c = Circle(radius=r, stroke_color=color, stroke_width=2.5)
    return VGroup(c, T(str(n), size, color, weight=BOLD).move_to(c))


def persona(color=TEXTO, s=1.0):
    cabeza = Circle(radius=0.16, stroke_color=color, stroke_width=3).shift(UP * 0.2)
    cuerpo = Arc(radius=0.28, start_angle=0, angle=PI, stroke_color=color, stroke_width=3).shift(DOWN * 0.28)
    return VGroup(cabeza, cuerpo).scale(s)


def tilde(color=VERDE, s=1.0):
    return VMobject(stroke_color=color, stroke_width=7).set_points_as_corners(
        [[-0.18, 0, 0], [-0.05, -0.14, 0], [0.2, 0.16, 0]]).scale(s)


def cruz(color=ROJO, s=1.0):
    return VGroup(
        Line([-0.14, -0.14, 0], [0.14, 0.14, 0]), Line([-0.14, 0.14, 0], [0.14, -0.14, 0]),
    ).set_stroke(color, 7).scale(s)


def flecha(a, b, color=GRIS, buff=0.08, sw=3):
    return Arrow(a, b, buff=buff, stroke_width=sw, color=color, tip_length=0.18,
                 max_tip_length_to_length_ratio=0.35, max_stroke_width_to_length_ratio=20)


def flecha_punteada(a, b, color=GRIS):
    a, b = np.array(a, dtype=float), np.array(b, dtype=float)
    d = (b - a) / np.linalg.norm(b - a)
    return VGroup(DashedLine(a, b - d * 0.15, dash_length=0.1, stroke_width=3, color=color),
                  flecha(b - d * 0.3, b, color, buff=0))


def ficha(color, lado=0.28):
    """Un evento: un cuadradito del color del alumno o del área."""
    f = RoundedRectangle(width=lado, height=lado, corner_radius=lado * 0.2,
                         stroke_width=0, fill_color=color, fill_opacity=1)
    f.llego = False
    return f


def viaje(m, puntos, aparece=True, desaparece=False, run_time=1.0):
    """Mueve m por una poligonal; marca m.llego al terminar (para contadores)."""
    camino = VMobject().set_points_as_corners([np.array(p, dtype=float) for p in puntos])

    def f(mob, a):
        mob.move_to(camino.point_from_proportion(a))
        op = 1.0
        if aparece:
            op = min(op, a * 8)
        if desaparece:
            op = min(op, (1 - a) * 8)
        mob.set_fill(opacity=max(op, 0))
        if a >= 0.999:
            mob.llego = True

    return UpdateFromAlphaFunc(m, f, run_time=run_time)


def tabla(filas, anchos, size=22, interlinea=0.34, pad=0.24, izq=1, **kw):
    """Tabla de texto: la primera fila es el encabezado. Devuelve VGroup(filas, líneas)."""
    total = sum(anchos)
    filas_m, separadores, y = VGroup(), VGroup(), 0.0
    for i, fila in enumerate(filas):
        n = max(c.count("\n") + 1 for c in fila)
        h = n * interlinea * size / 22 + pad
        fm, x = VGroup(), 0.0
        for j, (c, w) in enumerate(zip(fila, anchos)):
            color = GRIS if i == 0 else TEXTO
            t = lineas(c, size, color, centrado=j >= izq, buff=0.06, **kw) if c else VGroup()
            if c:
                if j < izq:
                    t.move_to([x + 0.12 + t.width / 2, y - h / 2, 0])
                else:
                    t.move_to([x + w / 2, y - h / 2, 0])
            fm.add(t)
            x += w
        filas_m.add(fm)
        y -= h
        if i < len(filas) - 1:
            separadores.add(Line([0, y, 0], [total, y, 0], stroke_width=1.2, color=TENUE))
    g = VGroup(filas_m, separadores)
    g.anchos = anchos
    return g


def columna(tabla_m, j, color=AMARILLO):
    """Recuadro alrededor de la columna j de una tabla."""
    x0 = tabla_m.get_left()[0] + sum(tabla_m.anchos[:j])
    w = tabla_m.anchos[j]
    r = caja(w - 0.08, tabla_m.height + 0.2, color, fill=0.06, r=0.12, sw=2)
    return r.move_to([x0 + w / 2, tabla_m.get_center()[1], 0])


# ---------------------------------------------------------------- base


class Base(Slide):
    N = 0
    NOTA = ""
    FINAL = False

    def construct(self):
        self.wait_time_between_slides = 0.1
        self.next_slide(notes=self.NOTA)
        if self.N:
            self.num = T(str(self.N), 20, TENUE).to_corner(DR, buff=0.3)
            self.add(self.num)
        self.cuerpo()
        if not self.FINAL:
            # Al apretar la tecla en el último paso, la diapositiva se desvanece
            # y la siguiente arranca sola.
            self.next_slide(auto_next=True)
            self.play(FadeOut(Group(*self.mobjects)), run_time=0.6)

    def paso(self, nota="", **kw):
        self.next_slide(notes=nota, **kw)

    def titulo(self, s, size=46):
        return T(s, size, weight=BOLD).to_corner(UL, buff=0.5)


# ---------------------------------------------------------------- 1. portada


class S01Portada(Base):
    N = 1
    NOTA = ("Franco · Parte 1 (0:00 – 1:00)\n\n"
            "Buenas tardes. Somos el grupo ___: Franco, Francisco, Andrés y Eugenio, "
            "y les presentamos YOLO.")

    def cuerpo(self):
        yolo = T("YOLO", 150, weight=BOLD)
        lema = T("Descubrí tu camino", 48, AMARILLO, slant=ITALIC)
        integrantes = lineas("Franco Branda · Francisco Costa\nAndrés Garbarz · Eugenio Migliaro", 30, TEXTO)
        izq = VGroup(yolo, lema, integrantes).arrange(DOWN, aligned_edge=LEFT, buff=0.4)
        integrantes.shift(DOWN * 0.35)
        izq.to_edge(LEFT, buff=0.9).shift(UP * 0.35)
        pie = T("Trabajo Práctico Integrador Final · Ingeniería de Software II · 2.º cuatrimestre de 2026",
                20, GRIS).to_edge(DOWN, buff=0.5).align_to(izq, LEFT)

        o = np.array([1.5, -0.1, 0])
        origen = Dot(o, radius=0.12, color=TEXTO)
        ramas, nodos, nombres = VGroup(), VGroup(), VGroup()
        for (nombre, color), y in zip(AREAS, [2.0, -0.1, -2.2]):
            p = np.array([4.5, y, 0])
            rama = CubicBezier(o, o + RIGHT * 1.7, p + LEFT * 1.7, p)
            rama.set_stroke([GRIS, color], width=4)
            n = Dot(p, radius=0.2, color=color)
            ramas.add(rama)
            nodos.add(n)
            nombres.add(T(nombre, 32, color).next_to(n, RIGHT, buff=0.25))

        self.play(Write(yolo), run_time=1.2)
        self.play(FadeIn(lema, shift=UP * 0.2))
        self.play(GrowFromCenter(origen))
        self.play(LaggedStart(*[Create(r) for r in ramas], lag_ratio=0.25), run_time=1.4)
        self.play(LaggedStart(*[AnimationGroup(GrowFromCenter(n), FadeIn(e, shift=LEFT * 0.2))
                                for n, e in zip(nodos, nombres)], lag_ratio=0.2))
        self.play(FadeIn(integrantes, shift=UP * 0.2), FadeIn(pie))

        # Mientras se presentan: tres exploraciones que recorren los caminos.
        self.paso(self.NOTA, loop=True)
        viajeros = VGroup(*[Dot(o, radius=0.09, color=c).set_opacity(0) for _, c in AREAS])
        self.add(viajeros)
        self.play(LaggedStart(*[
            AnimationGroup(
                UpdateFromAlphaFunc(v, lambda m, a, r=r: m.move_to(r.point_from_proportion(a))
                                    .set_opacity(min(1, a * 6, (1 - a) * 6)), run_time=1.6),
                Succession(Wait(1.4), Indicate(n, color=c, scale_factor=1.5, run_time=0.8)),
            ) for v, r, n, (_, c) in zip(viajeros, ramas, nodos, AREAS)
        ], lag_ratio=0.45))
        self.wait(0.6)
        self.remove(viajeros)


# ---------------------------------------------------------------- 2. problema


class S02Problema(Base):
    N = 2
    NOTA = ("Franco · Parte 1\n\n"
            "Elegir una carrera al terminar el secundario es una decisión grande que se toma "
            "con poca información.")

    def item(self, n, titulo, sub):
        textos = VGroup(T(titulo, 28), lineas(sub, 21)).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
        circulo = numero(n)
        return VGroup(circulo, textos).arrange(RIGHT, buff=0.3, aligned_edge=UP)

    def cuerpo(self):
        tit = self.titulo("El problema y la propuesta")
        etq = T("EL TEST VOCACIONAL TRADICIONAL", 22, GRIS)
        items = VGroup(
            self.item(1, "Pregunta por lo que nunca probó",
                      "El alumno responde según la imagen\nque tiene de cada carrera."),
            self.item(2, "Mide lo que el alumno declara",
                      "Pesan la familia, los amigos\ny el prestigio de la profesión."),
            self.item(3, "Es la foto de un solo día",
                      "A una edad en la que los intereses\ntodavía cambian."),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.38)
        VGroup(etq, items).arrange(DOWN, aligned_edge=LEFT, buff=0.35).next_to(tit, DOWN, buff=0.45, aligned_edge=LEFT)

        eje = Arrow([-6.5, -2.95, 0], [6.6, -2.95, 0], buff=0, stroke_width=3, color=GRIS,
                    tip_length=0.2, max_tip_length_to_length_ratio=0.05)
        tiempo = T("tiempo", 20, GRIS).next_to(eje.get_end(), DOWN, buff=0.12).shift(LEFT * 0.4)
        foto = Dot([-2.0, -2.95, 0], radius=0.11, color=AMARILLO)
        foto_lbl = T("el test", 20, AMARILLO).next_to(foto, DOWN, buff=0.15)

        self.play(FadeIn(tit, shift=DOWN * 0.2), FadeIn(etq))
        notas = [
            "El test vocacional tradicional pregunta por actividades que el alumno nunca probó,",
            "mide lo que declara",
            "y saca una foto de un solo día. Y los padres y profesores, que acompañan esa decisión, "
            "ven a lo sumo el resultado del test.",
        ]
        for i, (it, nota) in enumerate(zip(items, notas)):
            self.paso(nota)
            self.play(FadeIn(it[0], scale=0.6), FadeIn(it[1], shift=RIGHT * 0.3))
            if i == 2:
                self.play(GrowArrow(eje), FadeIn(tiempo))
                self.play(GrowFromCenter(foto), FadeIn(foto_lbl))
                self.play(Indicate(foto, color=AMARILLO, scale_factor=1.8))

        # La propuesta
        etq2 = T("LA PROPUESTA", 22, GRIS)
        lema = T("Explorar carreras jugando", 38, AMARILLO)
        chips = VGroup(*[pastilla(n, c, 22) for n, c in AREAS]).arrange(RIGHT, buff=0.2)
        valor = lineas("No recomienda una carrera: registra\ncómo explora el alumno y lo convierte\n"
                       "en información que un adulto entiende.", 25, TEXTO)
        modelo = T("Suscripción mensual, a través del colegio", 24, GRIS)
        der = VGroup(etq2, lema, chips, valor, modelo).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        valor.shift(DOWN * 0.1)
        modelo.shift(DOWN * 0.2)
        der.move_to([0.4, 0, 0], aligned_edge=LEFT).align_to(etq, UP)

        random.seed(4)
        xs = sorted(random.uniform(-6.2, 6.1) for _ in range(38))
        jugadas = VGroup(*[Dot([x, -2.95, 0], radius=0.075, color=random.choice(AREAS)[1]) for x in xs])
        registro = T("cada jugada queda registrada", 20, TEXTO).move_to([0, -3.3, 0])

        self.paso("YOLO propone otra cosa: que el alumno explore las carreras jugando. Es una plataforma "
                  "web con juegos por área, hoy Medicina, Sistemas y Derecho, con niveles que se van profundizando.")
        self.play(items.animate.set_opacity(0.35), FadeIn(etq2), FadeIn(lema, shift=UP * 0.2))
        self.play(LaggedStart(*[FadeIn(c, scale=0.7) for c in chips], lag_ratio=0.2))
        self.play(FadeOut(foto), FadeOut(foto_lbl), FadeOut(tiempo))
        self.play(LaggedStart(*[GrowFromCenter(j) for j in jugadas], lag_ratio=0.06), FadeIn(registro), run_time=2)

        self.paso("No recomienda una carrera: registra cómo explora el alumno y lo convierte en información "
                  "que un adulto entiende. Ese es el valor diferencial. El modelo de negocio es una suscripción "
                  "mensual que las familias pagan a través del colegio.")
        self.play(FadeIn(valor, shift=UP * 0.2))
        self.play(FadeIn(modelo, shift=UP * 0.2))


# ---------------------------------------------------------------- 3. funcionalidades


class S03Funcionalidades(Base):
    N = 3
    NOTA = "Franco · Parte 2 (1:00 – 2:15)\n\nEl producto tiene seis funcionalidades principales."

    def cuerpo(self):
        tit = self.titulo("Funcionalidades del producto")
        datos = [("Juegos", "uno por carrera", True), ("Recorrido", "tiempo y profundidad", True),
                 ("Dashboard", "padres y profesores", True), ("Alertas", "interés y frustración", True),
                 ("Reportes", "por curso", False), ("Contenidos", "y suscripciones", False)]
        tarjetas = VGroup()
        for nombre, sub, _ in datos:
            fondo = caja(4.0, 1.45, GRIS, fill=0.05)
            textos = VGroup(T(nombre, 36, weight=BOLD), T(sub, 24, GRIS)).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
            textos.move_to(fondo).align_to(fondo, LEFT).shift(RIGHT * 0.35)
            tarjetas.add(VGroup(fondo, textos))
        tarjetas.arrange_in_grid(rows=2, cols=3, buff=(0.35, 0.35)).next_to(tit, DOWN, buff=0.5).set_x(0)

        self.play(FadeIn(tit, shift=DOWN * 0.2))
        self.play(LaggedStart(*[FadeIn(t, shift=UP * 0.25) for t in tarjetas], lag_ratio=0.12))

        self.paso("Cuatro están en la prueba de concepto: los juegos, el registro del recorrido, el dashboard "
                  "para padres y profesores y las alertas. Las otras dos, los reportes por curso y la gestión de "
                  "contenidos y suscripciones, todavía no están hechas.")
        anims_poc, anims_no = [], []
        for t, (_, _, poc) in zip(tarjetas, datos):
            fondo, textos = t
            tag = pastilla("En la PoC" if poc else "Todavía no", VERDE if poc else GRIS)
            tag.move_to(fondo.get_corner(UR) + np.array([-tag.width / 2 - 0.25, 0, 0]))
            if poc:
                anims_poc.append(AnimationGroup(fondo.animate.set_stroke(VERDE).set_fill(VERDE, 0.1),
                                                FadeIn(tag, scale=0.8)))
            else:
                anims_no.append(AnimationGroup(textos.animate.set_opacity(0.4), FadeIn(tag, scale=0.8)))
        self.play(LaggedStart(*anims_poc, lag_ratio=0.15))
        self.play(*anims_no)

        self.paso("Para la prueba de concepto elegimos la historia central: como padre o profesor, quiero ver "
                  "cuánto tiempo le dedica el alumno a cada área, hasta dónde llegó, y enterarme cuando descubre "
                  "un interés o se frustra.")
        etq = T("HISTORIA DE USUARIO DE LA PoC", 20, GRIS)
        historia = T("Como padre o profesor, quiero ver cuánto tiempo le dedica el alumno a cada área,\n"
                     "hasta dónde llegó, y enterarme cuando descubre un interés o se frustra.", 24,
                     t2c={"padre o profesor": AZUL, "cuánto tiempo le dedica": AMARILLO,
                          "hasta dónde llegó": AMARILLO, "un interés o se frustra": ROJO})
        bloque = VGroup(etq, historia).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        marco = caja(tarjetas.width, bloque.height + 0.5, TEXTO, fill=0.04)
        marco.next_to(tarjetas, DOWN, buff=0.45)
        bloque.move_to(marco).align_to(marco, LEFT).shift(RIGHT * 0.35)
        self.play(FadeIn(marco), FadeIn(etq), Write(historia), run_time=2)
        self.play(Indicate(tarjetas[2][0], color=AZUL, scale_factor=1.04),
                  Indicate(tarjetas[1][0], color=AMARILLO, scale_factor=1.04),
                  Indicate(tarjetas[3][0], color=ROJO, scale_factor=1.04), run_time=1.4)


# ---------------------------------------------------------------- 4. decisión


TIEMPOS = ["0:00", "0:40", "1:25", "2:05", "2:50", "3:30", "4:20", "5:15", "6:10"]
NIVELES = [0, 0, 0, 1, 1, 1, 1, 2, 2]


class S04Decision(Base):
    N = 4
    NOTA = "Franco · Parte 2\n\nCada jugada es un evento, y ahí aparece la decisión."

    def cuerpo(self):
        tit = self.titulo("¿Por qué Kafka?")
        juego = nodo("juego", None, VERDE, w=1.9, h=0.9, size=32).move_to([-5.7, -0.2, 0])
        evento = VGroup(ficha(ROJO), T("= un evento", 22, GRIS)).arrange(RIGHT, buff=0.15)
        evento.next_to(juego, DOWN, buff=0.3)

        # Carril A: escribir directo en Postgres
        lbl_a = T("Postgres directo", 30, weight=BOLD).move_to([-3.6, 2.4, 0], aligned_edge=LEFT)
        cap_a = T("guarda el resultado", 26, GRIS).next_to(lbl_a, RIGHT, buff=0.35)
        pg = caja(3.3, 1.65, AZUL).move_to([-1.35, 1.15, 0])
        fichas_a = VGroup(*[ficha(AREAS[i % 3][1]) for i in range(8)])
        for f in fichas_a:
            f.move_to(juego).set_fill(opacity=0)

        def contador():
            n = sum(f.llego for f in fichas_a)
            g = VGroup(T(f"tiempo   {TIEMPOS[n]}", 26, font=MONO), T(f"niveles  {NIVELES[n]}", 26, font=MONO))
            return g.arrange(DOWN, aligned_edge=LEFT, buff=0.15).move_to(pg).align_to(pg, UP).shift(DOWN * 0.25 + RIGHT * 0.0)

        cont = always_redraw(contador)
        fl_a = flecha(juego.get_corner(UR) + LEFT * 0.3, pg.get_left())

        # Carril B: Kafka
        lbl_b = T("Kafka", 30, weight=BOLD).move_to([-2.95, -0.95, 0], aligned_edge=LEFT)
        cap_b = T("guarda todo lo que pasó", 26, GRIS).next_to(lbl_b, RIGHT, buff=0.35)
        celdas = VGroup(*[Square(0.44, stroke_color=TENUE, stroke_width=2).move_to([-2.7 + i * 0.52, -1.65, 0])
                          for i in range(12)])
        entrada = celdas[0].get_left() + LEFT * 0.05
        fl_b = flecha(juego.get_corner(DR) + LEFT * 0.3, entrada)
        fichas_b = VGroup(*[ficha(AREAS[i % 3][1]) for i in range(11)])
        for f in fichas_b:
            f.move_to(juego).set_fill(opacity=0)

        self.play(FadeIn(tit, shift=DOWN * 0.2), FadeIn(juego, scale=0.8))
        self.play(FadeIn(evento, shift=UP * 0.2))

        self.paso("La alternativa seria a Kafka no era otro broker: era no usar ninguno y escribir directo en "
                  "Postgres, que para un piloto alcanza y sobra.")
        self.play(FadeIn(lbl_a), GrowArrow(fl_a), FadeIn(pg))
        self.add(fichas_a, cont)
        self.play(LaggedStart(*[viaje(f, [fl_a.get_start(), fl_a.get_end(), pg.get_center()], desaparece=True)
                                for f in fichas_a], lag_ratio=0.3), run_time=3)
        self.remove(fichas_a)
        self.play(FadeIn(cap_a, shift=LEFT * 0.2))

        self.paso("Entonces, ¿por qué Kafka? Porque Kafka guarda todo lo que pasó, y no solo el resultado.")
        self.play(FadeIn(lbl_b), GrowArrow(fl_b), LaggedStart(*[Create(c) for c in celdas], lag_ratio=0.05))
        self.add(fichas_b[:8])
        self.play(LaggedStart(*[viaje(f, [fl_b.get_start(), entrada, celdas[i].get_center()])
                                for i, f in enumerate(fichas_b[:8])], lag_ratio=0.3), run_time=3)
        self.play(FadeIn(cap_b, shift=LEFT * 0.2))

        self.paso("Hoy medimos tiempo y niveles. Mañana vamos a querer medir otra cosa, y con Kafka la "
                  "calculamos sobre todo lo que los alumnos ya jugaron.")
        manana = T("Mañana: una métrica nueva", 30, AMARILLO).move_to([3.9, 1.6, 0])
        nueva_a = T("nueva    ?", 26, ROJO, font=MONO).next_to(cont, DOWN, buff=0.15, aligned_edge=LEFT)
        sin = lineas("sin la historia,\nno hay con qué calcularla", 22, GRIS).next_to(manana, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(FadeIn(manana, shift=DOWN * 0.2))
        self.play(FadeIn(nueva_a), FadeIn(sin))
        puntero = Triangle(color=AMARILLO, fill_opacity=1, stroke_width=0).scale(0.13)
        puntero.next_to(celdas[0], DOWN, buff=0.12)
        offset = T("offset 0", 20, AMARILLO).next_to(puntero, DOWN, buff=0.1)
        self.play(FadeIn(puntero, shift=UP * 0.2), FadeIn(offset))
        self.play(
            puntero.animate.next_to(celdas[7], DOWN, buff=0.12),
            offset.animate.next_to(celdas[7], DOWN, buff=0.37),
            LaggedStart(*[Indicate(f, color=AMARILLO, scale_factor=1.35) for f in fichas_b[:8]], lag_ratio=0.25),
            run_time=2.4,
        )
        ok_b = VGroup(T("métrica nueva sobre toda la historia", 22, VERDE), tilde(s=0.8)).arrange(RIGHT, buff=0.2)
        ok_b.next_to(celdas[:8], DOWN, buff=0.75)
        self.play(FadeOut(offset), FadeIn(ok_b, shift=UP * 0.2))

        self.paso("Y además el juego queda separado del resto: si se cae el mail o el dashboard, el alumno "
                  "sigue jugando.")
        dash = nodo("dashboard", None, AZUL, w=2.0, h=0.7, size=24).move_to([5.0, -1.05, 0])
        mail = nodo("mail", None, AZUL, w=2.0, h=0.7, size=24).move_to([5.0, -2.25, 0])
        salida = celdas[-1].get_right()
        fls = VGroup(flecha(salida, dash.get_left()), flecha(salida, mail.get_left()))
        self.play(FadeOut(puntero), FadeIn(dash), FadeIn(mail), *[GrowArrow(f) for f in fls])
        caidos = VGroup(cruz().next_to(dash, RIGHT, buff=0.2), cruz().next_to(mail, RIGHT, buff=0.2))
        self.play(dash[0].animate.set_stroke(ROJO).set_fill(ROJO, 0.1), mail[0].animate.set_stroke(ROJO).set_fill(ROJO, 0.1),
                  dash[1].animate.set_opacity(0.4), mail[1].animate.set_opacity(0.4), Create(caidos))
        self.add(fichas_b[8:])
        sigue = VGroup(tilde(s=0.8), T("el juego sigue", 24, VERDE)).arrange(RIGHT, buff=0.2)
        sigue.next_to(evento, DOWN, buff=0.4)
        self.play(LaggedStart(*[viaje(f, [fl_b.get_start(), entrada, celdas[8 + i].get_center()])
                                for i, f in enumerate(fichas_b[8:])], lag_ratio=0.35),
                  FadeIn(sigue, shift=UP * 0.2), run_time=2.2)

        self.paso("(La comparación con RabbitMQ y el batch no se dice: queda en pantalla y para las preguntas.)")
        cont.clear_updaters()
        self.play(*[FadeOut(m) for m in self.mobjects if m not in (tit, self.num)])

        razones = VGroup()
        for n, t1, t2 in [(1, "Guarda todo lo que pasó", "Una métrica nueva se calcula sobre\ntodo lo que los alumnos ya jugaron."),
                          (2, "Separa el juego del resto", "Si se cae el mail o el dashboard,\nel alumno sigue jugando.")]:
            textos = VGroup(T(t1, 32, weight=BOLD), lineas(t2, 23)).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
            razones.add(VGroup(numero(n), textos).arrange(RIGHT, buff=0.3, aligned_edge=UP))
        razones[0].move_to([-6.5, 1.85, 0], aligned_edge=LEFT)
        razones[1].move_to([0.6, 1.85, 0], aligned_edge=LEFT)
        alternativa = T("La alternativa seria no era otro broker: era no usar ninguno.", 26, GRIS, slant=ITALIC)
        alternativa.move_to([-6.5, 0.55, 0], aligned_edge=LEFT)
        tab = tabla([
            ["", "Postgres directo", "Kafka", "RabbitMQ", "Batch nocturno"],
            ["Métrica nueva\nsobre la historia", "Solo con un log\naparte", "Sí: el log\nse relee", "No en colas\nclásicas", "Solo con un log\naparte"],
            ["Si se cae el mail", "Lo maneja el juego", "El juego sigue", "El juego sigue", "Se reintenta"],
            ["Costo de operarlo", "Bajo", "Medio-alto", "Medio", "Medio"],
        ], [3.0, 2.6, 2.6, 2.6, 2.6], size=21)
        tab.move_to([0, -1.7, 0])
        resalte = columna(tab, 2)
        tab[0][0][2].set_color(AMARILLO)
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.3) for r in razones], lag_ratio=0.3))
        self.play(FadeIn(alternativa))
        self.play(LaggedStart(*[FadeIn(f, shift=UP * 0.15) for f in tab[0]], lag_ratio=0.15), Create(tab[1]))
        self.play(Create(resalte))


# ---------------------------------------------------------------- 5. arquitectura


ALUMNOS = [AMARILLO, TEAL, NARANJA]
PARTICION = {0: 0, 1: 2, 2: 1}  # clave = id del alumno


class S05Arquitectura(Base):
    N = 5
    NOTA = ("Eugenio · Parte 3 (2:15 – 3:40)\n\n"
            "La arquitectura es publish–subscribe sobre un log. El alumno juega en la app web.")

    def cuerpo(self):
        tit = self.titulo("Arquitectura de la PoC", 44)
        estilo = T("publish–subscribe sobre un log", 26, GRIS, slant=ITALIC).next_to(tit, DOWN, buff=0.18, aligned_edge=LEFT)

        alumno = persona().move_to([-6.3, 1.8, 0])
        alumno_lbl = T("Alumno", 22).next_to(alumno, DOWN, buff=0.15)
        colores = VGroup(*[Dot(radius=0.07, color=c) for c in ALUMNOS]).arrange(RIGHT, buff=0.12).next_to(alumno_lbl, DOWN, buff=0.15)
        app = nodo("App web", "tres juegos", AZUL, w=2.4, h=1.1, size=30, subsize=22).move_to([-4.15, 1.75, 0])
        ingesta = nodo("POST /api/eventos", "valida · publica", AZUL, w=2.4, h=1.1, size=22, subsize=20, mono=True).move_to([-4.15, -0.6, 0])
        fl_1 = flecha(alumno.get_right() + RIGHT * 0.05, app.get_left())
        fl_2 = flecha(app.get_bottom(), ingesta.get_top())

        kafka = caja(4.0, 2.9, TEAL).move_to([-0.35, -0.6, 0])
        cabecera = VGroup(T("Kafka", 30, weight=BOLD), T("juego.eventos", 22, TEAL, font=MONO)).arrange(RIGHT, buff=0.25)
        cabecera.move_to(kafka).align_to(kafka, UP).shift(DOWN * 0.22)
        filas_y = [-0.02, -0.6, -1.18]
        rotulos = VGroup(*[T(f"P{i}", 20, GRIS).move_to([-2.0, y, 0]) for i, y in enumerate(filas_y)])
        celdas = [[Square(0.38, stroke_color=TENUE, stroke_width=1.5).move_to([-1.55 + k * 0.46, y, 0]) for k in range(7)]
                  for y in filas_y]
        celdas_m = VGroup(*[c for fila in celdas for c in fila])
        clave = T("clave = id del alumno", 20, GRIS).move_to([-0.35, -1.75, 0])
        fl_3 = flecha(ingesta.get_right(), kafka.get_left())

        proyector = nodo("proyector", None, NARANJA, w=2.2, h=0.85, size=28).move_to([3.15, 0.4, 0])
        alertas = nodo("alertas", None, ROJO, w=2.2, h=0.85, size=28).move_to([3.15, -1.6, 0])
        fl_p = flecha(kafka.get_right() + UP * 0.6, proyector.get_left())
        fl_al = flecha(kafka.get_right() + DOWN * 0.8, alertas.get_left())
        cap_p = VGroup(T("tiempo efectivo · sesiones", 20, GRIS), T("profundidad", 20, GRIS)).arrange(DOWN, buff=0.08)
        cap_p.next_to(proyector, UP, buff=0.12)
        cap_al = T("interés · frustración", 20, GRIS).next_to(alertas, DOWN, buff=0.15)

        pg = nodo("Postgres", "modelo de lectura", AZUL, w=2.1, h=1.05, size=28, subsize=20).move_to([5.95, 0.4, 0])
        mail = nodo("Mail", "Mailpit", AZUL, w=2.1, h=0.85, size=28, subsize=20).move_to([5.95, -1.6, 0])
        dash = nodo("Dashboard", "cada 5 s", AZUL, w=2.1, h=0.85, size=26, subsize=20).move_to([5.95, 2.15, 0])
        padre = persona(s=0.85).move_to([3.4, 2.15, 0])
        padre_lbl = T("padre o profesor", 20).next_to(padre, LEFT, buff=0.2)
        fl_pg = flecha(proyector.get_right(), pg.get_left())
        fl_mail = flecha(alertas.get_right(), mail.get_left())
        fl_alpg = flecha(alertas.get_corner(UR) + LEFT * 0.15, pg.get_corner(DL) + RIGHT * 0.15)
        fl_dash = flecha(padre.get_right() + RIGHT * 0.1, dash.get_left())
        fl_lee = flecha(dash.get_bottom(), pg.get_top())

        def celda(fila, k):
            return celdas[fila][k].get_center()

        # 1. Alumno y app
        self.play(FadeIn(tit, shift=DOWN * 0.2), FadeIn(estilo))
        self.play(FadeIn(alumno), FadeIn(alumno_lbl), FadeIn(colores))
        self.play(GrowArrow(fl_1), FadeIn(app, shift=RIGHT * 0.2))

        # 2. Validación en el servidor
        self.paso("Cada jugada llega a un endpoint que la valida: el servidor decide si el nivel se completó, "
                  "el cliente no puede inventarlo. Después la publica en un tópico de Kafka.")
        self.play(GrowArrow(fl_2), FadeIn(ingesta, shift=DOWN * 0.2))
        primera = ficha(ALUMNOS[0], 0.3).move_to(alumno).set_fill(opacity=0)
        self.add(primera)
        espera = ingesta.get_right() + RIGHT * 0.3
        self.play(viaje(primera, [alumno.get_center(), app.get_center(), ingesta.get_center()], run_time=1.6))
        ok = tilde(s=0.9).next_to(ingesta, UR, buff=-0.15)
        self.play(Create(ok), Indicate(ingesta[0], color=VERDE, scale_factor=1.05))
        self.play(primera.animate.move_to(espera), FadeOut(ok))

        # 3. Kafka: tópico, clave y orden
        self.paso("La clave del mensaje es el id del alumno, así que los eventos de cada alumno quedan en orden.")
        self.play(GrowArrow(fl_3), FadeIn(kafka), FadeIn(cabecera), FadeIn(rotulos),
                  LaggedStart(*[Create(c) for c in celdas_m], lag_ratio=0.02))
        secuencia = [0, 1, 0, 2, 1, 0, 2, 0, 1]
        ocupadas = [0, 0, 0]
        fichas = VGroup(primera)
        viajes = []
        for i, a in enumerate(secuencia):
            p = PARTICION[a]
            k = ocupadas[p]
            ocupadas[p] += 1
            f = primera if i == 0 else ficha(ALUMNOS[a], 0.3).move_to(ingesta).set_fill(opacity=0)
            if i:
                fichas.add(f)
                self.add(f)
            inicio = espera if i == 0 else ingesta.get_center()
            viajes.append(viaje(f, [inicio, kafka.get_left() + RIGHT * 0.15, [-2.0, filas_y[p], 0], celda(p, k)],
                                aparece=i > 0))
        self.play(LaggedStart(*viajes, lag_ratio=0.25), FadeIn(clave), run_time=4)

        # 4. Dos grupos de consumidores
        self.paso("De ese tópico leen dos grupos de consumidores que no se conocen entre sí.")
        self.play(GrowArrow(fl_p), GrowArrow(fl_al), FadeIn(proyector, shift=LEFT * 0.2), FadeIn(alertas, shift=LEFT * 0.2))
        copias = [f.copy() for f in fichas for _ in range(2)]
        self.add(*copias)
        self.play(LaggedStart(*[
            viaje(c, [c.get_center(), kafka.get_right() + (UP * 0.6 if j % 2 == 0 else DOWN * 0.8),
                      (proyector if j % 2 == 0 else alertas).get_center()], aparece=False, desaparece=True)
            for j, c in enumerate(copias)], lag_ratio=0.08), run_time=3)
        self.remove(*copias)

        # 5. Proyector → Postgres → dashboard
        self.paso("El proyector calcula el tiempo efectivo, las sesiones y la profundidad, y arma en Postgres "
                  "el modelo de lectura que consulta el dashboard.")
        self.play(FadeIn(cap_p, shift=UP * 0.1))
        self.play(GrowArrow(fl_pg), FadeIn(pg, shift=LEFT * 0.2))
        filas_pg = [ficha(NARANJA, 0.2).move_to(proyector).set_fill(opacity=0) for _ in range(3)]
        self.add(*filas_pg)
        self.play(LaggedStart(*[viaje(f, [proyector.get_center(), pg.get_center()], desaparece=True)
                                for f in filas_pg], lag_ratio=0.3), run_time=1.5)
        self.play(FadeIn(padre), FadeIn(padre_lbl), GrowArrow(fl_dash), FadeIn(dash, shift=DOWN * 0.2))
        self.play(GrowArrow(fl_lee), Indicate(pg[0], color=AZUL, scale_factor=1.05))
        self.remove(*filas_pg)

        # 6. Alertas → mail
        self.paso("El de alertas detecta patrones: dos niveles completados de un área es interés; dos salidas "
                  "del mismo nivel después de intentar es frustración. Y manda el mail.")
        self.play(FadeIn(cap_al, shift=UP * 0.1))
        self.play(GrowArrow(fl_mail), FadeIn(mail, shift=LEFT * 0.2), GrowArrow(fl_alpg))
        sobre = VGroup(Rectangle(width=0.4, height=0.28, stroke_color=AMARILLO, stroke_width=2.5),
                       VMobject(stroke_color=AMARILLO, stroke_width=2.5).set_points_as_corners(
                           [[-0.2, 0.14, 0], [0, -0.02, 0], [0.2, 0.14, 0]])).move_to(alertas)
        self.play(FadeIn(sobre, scale=0.5))
        self.play(sobre.animate.move_to(mail), run_time=1)
        self.play(FadeOut(sobre, scale=0.5), Indicate(mail[0], color=AMARILLO, scale_factor=1.05))

        # 7. Tres tipos de procesamiento
        self.paso("Ahí están los tres tipos de procesamiento de eventos que vimos en la materia: single, stream y complex.")
        tipos = [("single", AMARILLO, "profundidad"), ("stream", TEAL, "tiempo efectivo, sesiones"),
                 ("complex", ROJO, "interés, frustración")]
        leyenda = VGroup(T("PROCESAMIENTO DE EVENTOS", 18, GRIS))
        for nombre, color, desc in tipos:
            leyenda.add(VGroup(T(nombre, 22, color, font=MONO, weight=BOLD), T(desc, 20, GRIS)).arrange(RIGHT, buff=0.2))
        leyenda.arrange(DOWN, aligned_edge=LEFT, buff=0.16).move_to([-6.75, 0, 0], aligned_edge=LEFT)
        leyenda.align_to([0, -1.5, 0], UP)
        for fila in leyenda[1:]:
            fila[1].align_to(leyenda[1][0], LEFT).shift(RIGHT * 1.3)
        self.play(FadeIn(leyenda[0]))
        self.play(FadeIn(leyenda[1], shift=RIGHT * 0.2), cap_p[1].animate.set_color(AMARILLO))
        self.play(FadeIn(leyenda[2], shift=RIGHT * 0.2), cap_p[0].animate.set_color(TEAL))
        self.play(FadeIn(leyenda[3], shift=RIGHT * 0.2), cap_al.animate.set_color(ROJO))

        # 8. Idempotencia
        self.paso("Y para no contar nada dos veces, cada evento lleva un id y el consumidor es idempotente.")
        idem = T("cada evento lleva un eventId: el repetido se ignora", 20, GRIS).move_to([1.6, -2.75, 0])
        self.play(FadeIn(idem))
        orig = fichas[0]
        dos = [orig.copy(), orig.copy()]
        self.add(*dos)
        camino = [orig.get_center(), kafka.get_right() + UP * 0.6, proyector.get_left() + LEFT * 0.05]
        self.play(viaje(dos[0], camino, aparece=False, desaparece=True, run_time=1.2))
        bien = tilde(s=0.8).next_to(proyector, DOWN, buff=0.15)
        self.play(Create(bien), Indicate(proyector[0], color=VERDE, scale_factor=1.05))
        self.play(viaje(dos[1], camino, aparece=False, run_time=1.2))
        rechazo = cruz(s=0.9).move_to(dos[1])
        self.play(Create(rechazo), dos[1].animate.shift(LEFT * 0.3).set_fill(opacity=0.3))
        self.play(FadeOut(dos[1]), FadeOut(rechazo), FadeOut(bien))
        self.remove(dos[0])

        # 9. Stack
        self.paso("El stack: Next.js y TypeScript, consumidores en Node, Kafka 4 en modo KRaft, Postgres, y Clerk "
                  "para la identidad. Todo se levanta con docker compose, y ese mismo compose corre en una "
                  "máquina virtual de Azure.")
        stack = [("Next.js", AZUL, [app, ingesta]), ("TypeScript", AZUL, []), ("Node", NARANJA, [proyector, alertas]),
                 ("Kafka 4 · KRaft", TEAL, [kafka]), ("Postgres", AZUL, [pg]), ("Clerk", VIOLETA, []),
                 ("docker compose", TEXTO, []), ("VM de Azure", TEXTO, [])]
        chips = VGroup(*[pastilla(n, c, 20) for n, c, _ in stack]).arrange(RIGHT, buff=0.15)
        chips.scale_to_fit_width(min(chips.width, 12.6)).move_to([0, -3.55, 0])
        for chip, (_, color, cajas) in zip(chips, stack):
            resaltes = [Indicate(c[0] if isinstance(c, VGroup) and len(c) == 2 else c, color=color, scale_factor=1.04)
                        for c in cajas]
            self.play(FadeIn(chip, shift=UP * 0.2), *resaltes, run_time=0.6)


# ---------------------------------------------------------------- 6. recursos


PERT = [("Ingesta y contratos de eventos", 2.2), ("Proyector, modelo de lectura y reproceso", 3.3),
        ("Dashboard validado con familias", 4.2), ("Alertas y mail con outbox", 2.2),
        ("Infraestructura, monitoreo y seguridad", 3.3), ("Pruebas y puesta en marcha", 3.2)]


class S06Recursos(Base):
    N = 6
    NOTA = "Eugenio · Parte 4 (3:40 – 4:35)\n\n¿Qué hace falta para llevarlo a producción?"

    def cuerpo(self):
        tit = self.titulo("Qué hace falta")
        formula = MathTex(r"\text{PERT} = \frac{O + 4M + P}{6}", font_size=38, color=GRIS).to_corner(UR, buff=0.5)
        self.play(FadeIn(tit, shift=DOWN * 0.2))

        # 1. PERT: seis paquetes que suman 18,3 semanas-persona
        self.paso("Estimamos con PERT el módulo de analíticas listo para el piloto: dieciocho semanas-persona.")
        u = 0.6
        colores = [AZUL, TEAL, VERDE, AMARILLO, NARANJA, VIOLETA]
        nombres, barras, valores = VGroup(), VGroup(), VGroup()
        for i, ((nombre, v), c) in enumerate(zip(PERT, colores)):
            y = 2.3 - i * 0.46
            nombres.add(T(nombre, 22, TEXTO).move_to([-1.3, y, 0], aligned_edge=RIGHT))
            b = Rectangle(width=v * u, height=0.32, stroke_width=0, fill_color=c, fill_opacity=0.85)
            barras.add(b.move_to([-1.0, y, 0], aligned_edge=LEFT))
            valores.add(T(f"{v:.1f}".replace(".", ","), 20, GRIS).next_to(b, RIGHT, buff=0.12))
        self.play(FadeIn(formula))
        self.play(LaggedStart(*[AnimationGroup(FadeIn(n), GrowFromEdge(b, LEFT), FadeIn(v))
                                for n, b, v in zip(nombres, barras, valores)], lag_ratio=0.15), run_time=2)
        x = -5.5
        destinos = []
        for b in barras:
            destinos.append(b.animate.move_to([x, -0.45, 0], aligned_edge=LEFT))
            x += b.width
        total = VGroup(T("18,3", 44, AMARILLO, weight=BOLD), T("semanas-persona", 26, TEXTO)).arrange(RIGHT, buff=0.2, aligned_edge=DOWN)
        total.next_to([-5.5, -0.45, 0], UP, buff=0.35, aligned_edge=LEFT)
        self.play(FadeOut(nombres), FadeOut(valores), LaggedStart(*destinos, lag_ratio=0.1), run_time=1.6)
        self.play(FadeIn(total, shift=UP * 0.2))

        # 2. Tres personas: 6 o 7 semanas de calendario
        self.paso("Con tres personas, una de backend y datos, una de frontend y una de producto y contenidos, son "
                  "seis o siete semanas de calendario, más una dedicación parcial a operación.")
        barra = Rectangle(width=18.3 * u, height=0.32, stroke_width=0, fill_color=AZUL, fill_opacity=0.85)
        barra.move_to([-5.5, -0.45, 0], aligned_edge=LEFT)
        self.play(FadeIn(barra), FadeOut(barras), run_time=0.6)
        tercios = VGroup(*[Rectangle(width=barra.width / 3, height=0.32, stroke_width=0, fill_color=AZUL, fill_opacity=0.85)
                           .move_to(barra.get_left() + RIGHT * barra.width * (k + 0.5) / 3) for k in range(3)])
        self.remove(barra)
        self.add(tercios)
        u2, x0 = 0.72, -2.6
        roles = ["backend y datos", "frontend", "producto y contenidos"]
        ys = [1.75, 1.15, 0.55]
        rol_m = VGroup(*[T(r, 22, TEXTO).move_to([x0 - 0.2, y, 0], aligned_edge=RIGHT) for r, y in zip(roles, ys)])
        lanes = [Rectangle(width=6.1 * u2, height=0.36, stroke_width=0, fill_color=AZUL, fill_opacity=0.85)
                 .move_to([x0, y, 0], aligned_edge=LEFT) for y in ys]
        eje = NumberLine(x_range=[0, 7, 1], length=7 * u2, color=GRIS, stroke_width=2, include_tip=False,
                         tick_size=0.06).move_to([x0, 0.12, 0], aligned_edge=LEFT)
        marcas = VGroup(*[T(str(k), 18, GRIS).next_to(eje.n2p(k), DOWN, buff=0.12) for k in range(8)])
        rango_eje = Line(eje.n2p(6), eje.n2p(7), color=AMARILLO, stroke_width=7)
        rango = VGroup(T("6 o 7", 36, AMARILLO, weight=BOLD), T("semanas de calendario", 24, TEXTO)).arrange(RIGHT, buff=0.18, aligned_edge=DOWN)
        rango.next_to([x0, 2.2, 0], UP, buff=0.1, aligned_edge=LEFT)
        operacion = T("+ dedicación parcial a operación", 20, GRIS).next_to(marcas, DOWN, buff=0.15).align_to(eje, LEFT)
        self.play(*[ReplacementTransform(t, l) for t, l in zip(tercios, lanes)],
                  total.animate.scale(0.75).move_to([-6.6, 2.42, 0], aligned_edge=LEFT).set_opacity(0.6),
                  FadeIn(rol_m), Create(eje), FadeIn(marcas), run_time=1.6)
        self.play(Create(rango_eje), FadeIn(rango, shift=UP * 0.2))
        self.play(FadeIn(operacion))

        # 3. Infraestructura
        self.paso("En infraestructura, el piloto corre en una máquina virtual de unos treinta dólares por mes; "
                  "los servicios gestionados quedan para la expansión.")
        vm = VGroup(T("USD 30", 56, AMARILLO, weight=BOLD), T("por mes", 26, TEXTO),
                    lineas("una VM de Azure para el piloto;\nlos servicios gestionados,\nen la expansión", 20, GRIS))
        vm.arrange(DOWN, aligned_edge=LEFT, buff=0.15).move_to([2.9, 1.2, 0], aligned_edge=LEFT)
        self.play(FadeIn(vm, shift=UP * 0.2))

        # 4. Riesgo
        self.paso("El riesgo principal lo decimos nosotros: Kafka es mucho para un piloto.")
        sep = Line([-6.6, -1.0, 0], [6.6, -1.0, 0], stroke_width=1.2, color=TENUE)
        riesgo = VGroup(T("RIESGO QUE ASUMIMOS", 20, GRIS), T("Kafka es mucho para un piloto", 34, weight=BOLD))
        riesgo.arrange(DOWN, aligned_edge=LEFT, buff=0.15).move_to([-6.6, -1.6, 0], aligned_edge=LEFT)
        juegos = nodo("juegos", None, VERDE, w=1.8, h=0.75, size=24).move_to([-5.7, -2.9, 0])
        bus = nodo("Kafka", None, TEAL, w=1.8, h=0.75, size=24).move_to([-0.6, -2.9, 0])
        cons = nodo("consumidores", None, NARANJA, w=2.4, h=0.75, size=24).move_to([4.6, -2.9, 0])
        c1 = flecha(juegos.get_right(), bus.get_left())
        c2 = flecha(bus.get_right(), cons.get_left())
        contrato = T("contratos de eventos", 20, GRIS).next_to(c1, UP, buff=0.08)
        contrato2 = T("contratos de eventos", 20, GRIS).next_to(c2, UP, buff=0.08)
        self.play(Create(sep), FadeIn(riesgo, shift=UP * 0.2))
        self.play(FadeIn(juegos), GrowArrow(c1), FadeIn(contrato), FadeIn(bus), GrowArrow(c2), FadeIn(contrato2), FadeIn(cons))

        self.paso("Lo aceptamos porque en una máquina virtual cuesta lo mismo, y porque si el piloto no crece se "
                  "puede reemplazar sin tocar los juegos: los contratos de eventos no cambian.\n\n"
                  "Ahora lo mostramos funcionando.")
        otro = nodo("otro bus", "p. ej. Postgres", AZUL, w=1.8, h=0.75, size=22, subsize=16).move_to(bus)
        self.play(bus.animate.shift(DOWN * 0.3).set_opacity(0), FadeIn(otro, shift=DOWN * 0.3), run_time=1)
        self.remove(bus)
        intacto = T("sin tocar los juegos", 22, VERDE).next_to(juegos, RIGHT, buff=0.3).shift(DOWN * 0.55)
        self.play(Indicate(juegos[0], color=VERDE, scale_factor=1.06), Indicate(contrato, color=VERDE),
                  Indicate(contrato2, color=VERDE), FadeIn(intacto))


# ---------------------------------------------------------------- 7. demo


class S07Demo(Base):
    N = 7
    NOTA = "Andy (voz) y Fran Costa (manos) · Demo, 5 minutos como máximo"

    def cuerpo(self):
        demo = T("Demo", 96, weight=BOLD)
        sub = T("Ahora lo mostramos funcionando", 34, GRIS)
        cab = VGroup(demo, sub).arrange(DOWN, buff=0.3).move_to([0, 1.7, 0])
        actos = ["El recorrido", "Interés en vivo", "Se cae el\nprocesamiento", "Releer la\nhistoria"]
        xs = [-4.5, -1.5, 1.5, 4.5]
        linea = Line([-5.3, -0.6, 0], [5.3, -0.6, 0], color=TENUE, stroke_width=3)
        nums = VGroup(*[numero(i + 1, AMARILLO, r=0.34, size=30).move_to([x, -0.6, 0]) for i, x in enumerate(xs)])
        for n in nums:
            n[0].set_fill(config.background_color, 1)
        nombres = VGroup(*[lineas(a, 26, TEXTO, centrado=True).next_to(n, DOWN, buff=0.3) for a, n in zip(actos, nums)])
        url = T("yolo-tpif-34cb00.brazilsouth.cloudapp.azure.com", 22, GRIS, font=MONO).to_edge(DOWN, buff=0.7)
        self.play(Write(demo), FadeIn(sub, shift=UP * 0.2))
        self.play(Create(linea))
        self.play(LaggedStart(*[AnimationGroup(GrowFromCenter(n), FadeIn(t, shift=UP * 0.2))
                                for n, t in zip(nums, nombres)], lag_ratio=0.25))
        self.play(FadeIn(url))


# ---------------------------------------------------------------- 8-13. respaldo


class S08Preguntas(Base):
    N = 8
    NOTA = "Preguntas: 10 minutos como mínimo. Las que siguen son diapositivas de respaldo."

    def cuerpo(self):
        tit = T("Preguntas", 80, weight=BOLD)
        sub = T("Diapositivas de respaldo", 30, GRIS)
        lista = VGroup(*[VGroup(T(str(n), 24, AMARILLO, weight=BOLD), T(s, 26)).arrange(RIGHT, buff=0.35)
                         for n, s in [(9, "Comparativa de alternativas"), (10, "Estimación PERT"),
                                      (11, "Atributos de calidad"), (12, "Despliegue en Azure"),
                                      (13, "Límites y próximos pasos")]])
        lista.arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        for fila in lista:
            fila[1].align_to(lista[1][1], LEFT)
        VGroup(VGroup(tit, sub).arrange(DOWN, aligned_edge=LEFT, buff=0.25), lista).arrange(RIGHT, buff=1.0, aligned_edge=UP)
        VGroup(tit, sub, lista).move_to(ORIGIN)
        self.play(Write(tit), FadeIn(sub))
        self.play(LaggedStart(*[FadeIn(f, shift=RIGHT * 0.2) for f in lista], lag_ratio=0.12))


class S09Comparativa(Base):
    N = 9

    def cuerpo(self):
        tit = self.titulo("Comparativa de alternativas")
        tab = tabla([
            ["", "Postgres directo", "Kafka", "RabbitMQ", "Batch nocturno"],
            ["Volumen del piloto", "Alcanza de sobra", "Excede lo\nnecesario", "Alcanza", "Alcanza"],
            ["Métrica nueva\nsobre la historia", "Solo con un log\naparte", "Sí: el log\nse relee", "No en colas\nclásicas", "Solo con un log\naparte"],
            ["Si se cae el mail", "Lo maneja el juego", "El juego sigue", "El juego sigue", "Se reintenta\nla corrida"],
            ["Consumidores\nindependientes", "Acoplados\nal código", "Grupos de\nconsumidores", "Una cola por\nconsumidor", "Tareas de un\nmismo DAG"],
            ["Aviso al adulto", "Al jugar", "Al jugar", "Al jugar", "Al día siguiente"],
            ["Costo de operarlo", "Bajo", "Medio-alto", "Medio", "Medio"],
        ], [3.0, 2.6, 2.6, 2.6, 2.6], size=20)
        tab.next_to(tit, DOWN, buff=0.4).set_x(0)
        tab[0][0][2].set_color(AMARILLO)
        nota = T("Batch nocturno: Airflow o Prefect. Es complementario, para el reporte por colegio.", 20, GRIS)
        nota.next_to(tab, DOWN, buff=0.3).align_to(tab, LEFT)
        self.play(FadeIn(tit, shift=DOWN * 0.2))
        self.play(LaggedStart(*[FadeIn(f, shift=UP * 0.1) for f in tab[0]], lag_ratio=0.08), Create(tab[1]))
        self.play(Create(columna(tab, 2)), FadeIn(nota))


class S10PERT(Base):
    N = 10

    def cuerpo(self):
        tit = self.titulo("Estimación PERT")
        filas = [["Paquete de trabajo", "O", "M", "P", "PERT"]]
        datos = [("Ingesta y contratos de eventos (Schema Registry)", 1, 2, 4), ("Proyector, modelo de lectura y reproceso", 2, 3, 6),
                 ("Dashboard validado con familias", 2, 4, 7), ("Alertas y mail transaccional con outbox", 1, 2, 4),
                 ("Infraestructura gestionada, monitoreo del atraso y seguridad", 2, 3, 6),
                 ("Pruebas y puesta en marcha del piloto", 2, 3, 5)]
        for nombre, o, m, p in datos:
            filas.append([nombre, str(o), str(m), str(p), f"{(o + 4 * m + p) / 6:.1f}".replace(".", ",")])
        filas.append(["Total", "", "", "", "18,3"])
        tab = tabla(filas, [8.6, 0.85, 0.85, 0.85, 1.35], size=21)
        tab.next_to(tit, DOWN, buff=0.45).set_x(0)
        for c in tab[0][-1]:
            c.set_color(AMARILLO)
        formula = MathTex(r"\text{PERT} = \frac{O + 4M + P}{6}", font_size=40, color=TEXTO)
        nota = lineas("En semanas-persona. Con tres personas,\n6 o 7 semanas de calendario más contingencia.", 20, GRIS)
        VGroup(formula, nota).arrange(RIGHT, buff=0.8).next_to(tab, DOWN, buff=0.35).set_x(0)
        self.play(FadeIn(tit, shift=DOWN * 0.2), FadeIn(formula))
        self.play(LaggedStart(*[FadeIn(f, shift=UP * 0.1) for f in tab[0]], lag_ratio=0.08), Create(tab[1]))
        self.play(FadeIn(nota))


class S11Atributos(Base):
    N = 11

    def cuerpo(self):
        tit = self.titulo("Atributos de calidad")
        tab = tabla([
            ["Escenario", "Mecanismo", "Evidencia en la PoC"],
            ["Confiabilidad: no se pierde\nninguna jugada", "Log durable y offsets\npor grupo", "Consumidores detenidos: el atraso\nllegó a 6 y después se procesó todo"],
            ["Confiabilidad: un reenvío\nno cuenta doble", "eventId registrado en la\nmisma transacción", "El mismo evento enviado dos veces\nse contó una"],
            ["Usabilidad: el adulto ve el\navance sin recargar", "Consumo en línea y\nconsulta cada 5 s", "Lo que juega Tomás aparece en el\nsiguiente refresco"],
            ["Disponibilidad: si fallan las\nalertas, el juego sigue", "Grupos de consumidores\nindependientes", "Al detener alertas, ni el juego ni\nel dashboard se enteraron"],
            ["Seguridad: cada adulto ve\nsolo a sus alumnos", "Filtro por vínculo\no por curso", "Un profesor que pide un alumno\nde otro curso recibe 404"],
            ["Modificabilidad: métrica nueva\nsin tocar lo existente", "Releer el log desde\nel offset 0", "Se borra el modelo de lectura\ny se reconstruye igual"],
        ], [4.4, 3.6, 5.0], size=20, izq=3, disable_ligatures=True)
        tab.next_to(tit, DOWN, buff=0.4).set_x(0)
        for fila in tab[0][1:]:
            texto = fila[0][0]
            dos_puntos = texto.text.index(":") + 1
            texto[:dos_puntos].set_color(AMARILLO)
        self.play(FadeIn(tit, shift=DOWN * 0.2))
        self.play(LaggedStart(*[FadeIn(f, shift=UP * 0.1) for f in tab[0]], lag_ratio=0.1), Create(tab[1]))


class S12Despliegue(Base):
    N = 12

    def cuerpo(self):
        tit = self.titulo("Despliegue en Azure")
        marco = DashedVMobject(RoundedRectangle(width=10.7, height=4.9, corner_radius=0.2, stroke_color=GRIS, stroke_width=2),
                               num_dashes=90).move_to([1.45, -0.4, 0])
        rot = T("VM de Azure · docker compose · puertos abiertos: 22, 80 y 443", 20, GRIS)
        rot.move_to(marco).align_to(marco, UP).align_to(marco, LEFT).shift(DOWN * 0.25 + RIGHT * 0.3)
        w, h = 2.0, 0.95
        caddy = nodo("Caddy", "TLS Let's Encrypt", TEXTO, w, h, 24, 16).move_to([-2.6, 0.7, 0])
        web = nodo("web", "Next.js", AZUL, w, h, 24, 16).move_to([-0.2, 0.7, 0])
        kafka = nodo("kafka", "KRaft", TEAL, w, h, 24, 16).move_to([2.2, 0.7, 0])
        kafka[0].set_fill(TEAL, 0.3)
        proy = nodo("proyector", None, NARANJA, w, 0.7, 22).move_to([5.3, 1.25, 0])
        alert = nodo("alertas", None, ROJO, w, 0.7, 22).move_to([5.3, 0.15, 0])
        kui = nodo("kafka-ui", "solo 127.0.0.1", TEXTO, w, h, 24, 16).move_to([-2.6, -1.75, 0])
        pg = nodo("postgres", "roles, vínculos y modelo de lectura", AZUL, 3.6, h, 24, 16).move_to([1.4, -1.75, 0])
        mp = nodo("mailpit", "solo 127.0.0.1", TEXTO, w, h, 24, 16).move_to([5.3, -1.75, 0])
        internet = nodo("Internet", None, TEXTO, 1.8, 0.7, 24).move_to([-5.7, 0.7, 0])
        equipo = nodo("Equipo", None, TEXTO, 1.8, 0.7, 24).move_to([-5.7, -1.75, 0])
        https = T("HTTPS 443", 18, GRIS).next_to(internet, DOWN, buff=0.12)
        tunel = T("túnel SSH", 18, GRIS).next_to(equipo, DOWN, buff=0.12)
        fls = VGroup(
            flecha(internet.get_right(), caddy.get_left()), flecha(caddy.get_right(), web.get_left()),
            flecha(web.get_right(), kafka.get_left()), flecha(kafka.get_right(), proy.get_left()),
            flecha(kafka.get_right(), alert.get_left()), flecha(web.get_bottom(), pg.get_top() + LEFT * 1.2),
            flecha(proy.get_left() + DOWN * 0.25, pg.get_top() + RIGHT * 1.0),
            flecha(alert.get_bottom() + LEFT * 0.4, pg.get_corner(UR) + LEFT * 0.2),
            flecha(alert.get_bottom() + RIGHT * 0.2, mp.get_top()),
        )
        tun = flecha_punteada(equipo.get_right(), kui.get_left())
        self.play(FadeIn(tit, shift=DOWN * 0.2), Create(marco), FadeIn(rot))
        self.play(LaggedStart(*[FadeIn(m, scale=0.9) for m in [internet, https, caddy, web, kafka, proy, alert]], lag_ratio=0.1))
        self.play(LaggedStart(*[FadeIn(m, scale=0.9) for m in [equipo, tunel, kui, pg, mp]], lag_ratio=0.1))
        self.play(LaggedStart(*[GrowArrow(f) for f in fls], lag_ratio=0.08), Create(tun))


class S13Limites(Base):
    N = 13
    FINAL = True

    def cuerpo(self):
        tit = self.titulo("Límites y próximos pasos")
        limites = VGroup(T("LÍMITES DE LA PoC", 20, GRIS))
        for t1, t2 in [("Un solo broker de Kafka", "En producción, tres brokers o un servicio gestionado."),
                       ("Clerk no está en el compose", "Sin sus claves no se puede entrar. Van con la entrega."),
                       ("El mail sale después de guardar la alerta", "Si falla, la alerta queda sin mail."),
                       ("El contenido de los juegos es de ejemplo", "Se evalúa la arquitectura, no las consignas.")]:
            limites.add(VGroup(T(t1, 24, weight=BOLD), T(t2, 20, GRIS)).arrange(DOWN, aligned_edge=LEFT, buff=0.1))
        limites.arrange(DOWN, aligned_edge=LEFT, buff=0.35).move_to([-6.5, 0, 0], aligned_edge=LEFT).align_to([0, 2.3, 0], UP)
        pasos = VGroup(T("PRÓXIMOS PASOS", 20, GRIS))
        for n, t1, t2 in [(1, "Reportes por curso", "Un consumidor nuevo sobre el mismo log."),
                          (2, "Outbox para los mails", "Que ninguna alerta quede sin avisar."),
                          (3, "Contratos de eventos", "Con Schema Registry.")]:
            textos = VGroup(T(t1, 24, weight=BOLD), T(t2, 20, GRIS)).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
            pasos.add(VGroup(numero(n), textos).arrange(RIGHT, buff=0.3, aligned_edge=UP))
        pasos.arrange(DOWN, aligned_edge=LEFT, buff=0.4).move_to([0.9, 0, 0], aligned_edge=LEFT)
        pasos.align_to(limites, UP)
        self.play(FadeIn(tit, shift=DOWN * 0.2))
        self.play(FadeIn(limites[0]), LaggedStart(*[FadeIn(l, shift=RIGHT * 0.2) for l in limites[1:]], lag_ratio=0.15))
        self.play(FadeIn(pasos[0]), LaggedStart(*[FadeIn(p, shift=RIGHT * 0.2) for p in pasos[1:]], lag_ratio=0.15))
