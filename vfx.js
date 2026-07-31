var tr=`
precision highp float;
in vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}
`,As=`
precision highp float;
attribute vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}
`,ts=`
precision highp float;
uniform vec2 offset;
uniform vec2 resolution;
uniform sampler2D src;
out vec4 outColor;
void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) {
        discard;
    }
    outColor = texture(src, uv);
}
`,O=`precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform bool autoCrop;
uniform sampler2D src;
out vec4 outColor;
`,X=`vec4 readTex(sampler2D tex, vec2 uv) {
    if (autoCrop && (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.)) {
        return vec4(0);
    }
    return texture(tex, uv);
}`,rs={none:ts,uvGradient:`
    ${O}
    ${X}

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        outColor = vec4(uv, sin(time) * .5 + .5, 1);

        vec4 img = readTex(src, uv);
        outColor *= smoothstep(0., 1., img.a);
    }
    `,rainbow:`
    ${O}
    ${X}

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hueShift(vec3 rgb, float t) {
        vec3 hsv = rgb2hsv(rgb);
        hsv.x = fract(hsv.x + t);
        return hsv2rgb(hsv);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec2 uv2 = uv;
        uv2.x *= resolution.x / resolution.y;

        float x = (uv2.x - uv2.y) - fract(time);

        vec4 img = readTex(src, uv);
        float gray = length(img.rgb);

        img.rgb = vec3(hueShift(vec3(1,0,0), x) * gray);

        outColor = img;
    }
    `,glitch:`
    ${O}
    ${X}

    float nn(float y, float t) {
        float n = (
            sin(y * .07 + t * 8. + sin(y * .5 + t * 10.)) +
            sin(y * .7 + t * 2. + sin(y * .3 + t * 8.)) * .7 +
            sin(y * 1.1 + t * 2.8) * .4
        );

        n += sin(y * 124. + t * 100.7) * sin(y * 877. - t * 38.8) * .3;

        return n;
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);

        float t = mod(time, 3.14 * 10.);

        // Seed value
        float v = fract(sin(t * 2.) * 700.);

        if (abs(nn(uv.y, t)) < 1.2) {
            v *= 0.01;
        }

        // Prepare for chromatic Abbreveation
        vec2 focus = vec2(0.5);
        float d = v * 0.6;
        vec2 ruv = focus + (uv - focus) * (1. - d);
        vec2 guv = focus + (uv - focus) * (1. - 2. * d);
        vec2 buv = focus + (uv - focus) * (1. - 3. * d);

        // Random Glitch
        if (v > 0.1) {
            // Randomize y
            float y = floor(uv.y * 13. * sin(35. * t)) + 1.;
            if (sin(36. * y * v) > 0.9) {
                ruv.x = uv.x + sin(76. * y) * 0.1;
                guv.x = uv.x + sin(34. * y) * 0.1;
                buv.x = uv.x + sin(59. * y) * 0.1;
            }

            // RGB Shift
            v = pow(v * 1.5, 2.) * 0.15;
            color.rgb *= 0.3;
            color.r += readTex(src, vec2(uv.x + sin(t * 123.45) * v, uv.y)).r;
            color.g += readTex(src, vec2(uv.x + sin(t * 157.67) * v, uv.y)).g;
            color.b += readTex(src, vec2(uv.x + sin(t * 143.67) * v, uv.y)).b;
        }

        // Compose Chromatic Abbreveation
        if (abs(nn(uv.y, t)) > 1.1) {
            color.r = color.r * 0.5 + color.r * texture(src, ruv).r;
            color.g = color.g * 0.5 + color.g * texture(src, guv).g;
            color.b = color.b * 0.5 + color.b * texture(src, buv).b;
            color *= 2.;
        }

        outColor = color;
        outColor.a = smoothstep(0.0, 0.8, max(color.r, max(color.g, color.b)));
    }
    `,pixelate:`
    ${O}
    ${X}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float b = sin(time * 2.) * 32. + 48.;
        uv = floor(uv * b) / b;
        outColor = readTex(src, uv);
    }
    `,rgbGlitch:`
    ${O}
    ${X}

    float random(vec2 st) {
        return fract(sin(dot(st, vec2(948.,824.))) * 30284.);
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec2 uvr = uv, uvg = uv, uvb = uv;

        float tt = mod(time, 17.);

        if (fract(tt * 0.73) > .8 || fract(tt * 0.91) > .8) {
            float t = floor(tt * 11.);

            float n = random(vec2(t, floor(uv.y * 17.7)));
            if (n > .7) {
                uvr.x += random(vec2(t, 1.)) * .1 - 0.05;
                uvg.x += random(vec2(t, 2.)) * .1 - 0.05;
                uvb.x += random(vec2(t, 3.)) * .1 - 0.05;
            }

            float ny = random(vec2(t * 17. + floor(uv * 19.7)));
            if (ny > .7) {
                uvr.x += random(vec2(t, 4.)) * .1 - 0.05;
                uvg.x += random(vec2(t, 5.)) * .1 - 0.05;
                uvb.x += random(vec2(t, 6.)) * .1 - 0.05;
            }
        }

        vec4 cr = readTex(src, uvr);
        vec4 cg = readTex(src, uvg);
        vec4 cb = readTex(src, uvb);

        outColor = vec4(
            cr.r,
            cg.g,
            cb.b,
            step(.1, cr.a + cg.a + cb.a)
        );
    }
    `,rgbShift:`
    ${O}
    ${X}

    float nn(float y, float t) {
        float n = (
            sin(y * .07 + t * 8. + sin(y * .5 + t * 10.)) +
            sin(y * .7 + t * 2. + sin(y * .3 + t * 8.)) * .7 +
            sin(y * 1.1 + t * 2.8) * .4
        );

        n += sin(y * 124. + t * 100.7) * sin(y * 877. - t * 38.8) * .3;

        return n;
    }

    float step2(float t, vec2 uv) {
        return step(t, uv.x) * step(t, uv.y);
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec2 uvr = uv, uvg = uv, uvb = uv;

        float t = mod(time, 30.);

        float amp = 10. / resolution.x;

        if (abs(nn(uv.y, t)) > 1.) {
            uvr.x += nn(uv.y, t) * amp;
            uvg.x += nn(uv.y, t + 10.) * amp;
            uvb.x += nn(uv.y, t + 20.) * amp;
        }

        vec4 cr = readTex(src, uvr);
        vec4 cg = readTex(src, uvg);
        vec4 cb = readTex(src, uvb);

        outColor = vec4(
            cr.r,
            cg.g,
            cb.b,
            smoothstep(.0, 1., cr.a + cg.a + cb.a)
        );
    }
    `,halftone:`
    // Halftone Effect by zoidberg
    // https://www.interactiveshaderformat.com/sketches/234

    ${O}
    ${X}

    // TODO: uniform
    #define gridSize 10.0
    #define dotSize 0.7
    #define smoothing 0.15
    #define speed 1.0

    #define IMG_PIXEL(x, y) readTex(x, (y - offset) / resolution);

    vec4 gridRot = vec4(15.0, 45.0, 75.0, 0.0);

    // during calculation we find the closest dot to a frag, determine its size, and then determine the size of the four dots above/below/right/left of it. this array of offsets move "one left", "one up", "one right", and "one down"...
    vec2 originOffsets[4];

    void main() {
        vec2 fragCoord = gl_FragCoord.xy - offset;

        // a halftone is an overlapping series of grids of dots
        // each grid of dots is rotated by a different amount
        // the size of the dots determines the colors. the shape of the dot should never change (always be a dot with regular edges)
        originOffsets[0] = vec2(-1.0, 0.0);
        originOffsets[1] = vec2(0.0, 1.0);
        originOffsets[2] = vec2(1.0, 0.0);
        originOffsets[3] = vec2(0.0, -1.0);

        vec3 rgbAmounts = vec3(0.0);

        // for each of the channels (i) of RGB...
        for (float i=0.0; i<3.0; ++i) {
            // figure out the rotation of the grid in radians
            float rotRad = radians(gridRot[int(i)]);

            // the grids are rotated counter-clockwise- to find the nearest dot, take the fragment pixel loc,
            // rotate it clockwise, and split by the grid to find the center of the dot. then rotate this
            // coord counter-clockwise to yield the location of the center of the dot in pixel coords local to the render space
            mat2 ccTrans = mat2(vec2(cos(rotRad), sin(rotRad)), vec2(-1.0*sin(rotRad), cos(rotRad)));
            mat2 cTrans = mat2(vec2(cos(rotRad), -1.0*sin(rotRad)), vec2(sin(rotRad), cos(rotRad)));

            // find the location of the frag in the grid (prior to rotating it)
            vec2 gridFragLoc = cTrans * fragCoord.xy;

            // find the center of the dot closest to the frag- there's no "round" in GLSL 1.2, so do a "floor" to find the dot to the bottom-left of the frag, then figure out if the frag would be in the top and right halves of that square to find the closest dot to the frag
            vec2 gridOriginLoc = vec2(floor(gridFragLoc.x/gridSize), floor(gridFragLoc.y/gridSize));

            vec2 tmpGridCoords = gridFragLoc/vec2(gridSize);
            bool fragAtTopOfGrid = ((tmpGridCoords.y-floor(tmpGridCoords.y)) > (gridSize/2.0)) ? true : false;
            bool fragAtRightOfGrid = ((tmpGridCoords.x-floor(tmpGridCoords.x)) > (gridSize/2.0)) ? true : false;
            if (fragAtTopOfGrid)
                gridOriginLoc.y = gridOriginLoc.y + 1.0;
            if (fragAtRightOfGrid)
                gridOriginLoc.x = gridOriginLoc.x + 1.0;

            // ...at this point, "gridOriginLoc" contains the grid coords of the nearest dot to the fragment being rendered
            // convert the location of the center of the dot from grid coords to pixel coords
            vec2 gridDotLoc = vec2(gridOriginLoc.x*gridSize, gridOriginLoc.y*gridSize) + vec2(gridSize/2.0);

            // rotate the pixel coords of the center of the dot so they become relative to the rendering space
            vec2 renderDotLoc = ccTrans * gridDotLoc;

            // get the color of the pixel of the input image under this dot (the color will ultimately determine the size of the dot)
            vec4 renderDotImageColorRGB = IMG_PIXEL(src, renderDotLoc + offset);

            // the amount of this channel is taken from the same channel of the color of the pixel of the input image under this halftone dot
            float imageChannelAmount = renderDotImageColorRGB[int(i)];

            // the size of the dot is determined by the value of the channel
            float dotRadius = imageChannelAmount * (gridSize * dotSize);
            float fragDistanceToDotCenter = distance(fragCoord.xy, renderDotLoc);
            if (fragDistanceToDotCenter < dotRadius) {
                rgbAmounts[int(i)] += smoothstep(dotRadius, dotRadius-(dotRadius*smoothing), fragDistanceToDotCenter);
            }

            // calcluate the size of the dots abov/below/to the left/right to see if they're overlapping
            for (float j=0.0; j<4.0; ++j) {
                gridDotLoc = vec2((gridOriginLoc.x+originOffsets[int(j)].x)*gridSize, (gridOriginLoc.y+originOffsets[int(j)].y)*gridSize) + vec2(gridSize/2.0);

                renderDotLoc = ccTrans * gridDotLoc;
                renderDotImageColorRGB = IMG_PIXEL(src, renderDotLoc + offset);

                imageChannelAmount = renderDotImageColorRGB[int(i)];
                dotRadius = imageChannelAmount * (gridSize*1.50/2.0);
                fragDistanceToDotCenter = distance(fragCoord.xy, renderDotLoc);
                if (fragDistanceToDotCenter < dotRadius) {
                    rgbAmounts[int(i)] += smoothstep(dotRadius, dotRadius-(dotRadius*smoothing), fragDistanceToDotCenter);
                }
            }
        }

        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 original = readTex(src, uv);
        float alpha = step(.1, rgbAmounts[0] + rgbAmounts[1] + rgbAmounts[2] + original.a);

        outColor = vec4(rgbAmounts[0], rgbAmounts[1], rgbAmounts[2], alpha);
    }
    `,sinewave:`
    ${O}
    ${X}

    vec4 draw(vec2 uv) {
        vec2 uvr = uv, uvg = uv, uvb = uv;

        float amp = 20. / resolution.x;

        uvr.x += sin(uv.y * 7. + time * 3.) * amp;
        uvg.x += sin(uv.y * 7. + time * 3. + .4) * amp;
        uvb.x += sin(uv.y * 7. + time * 3. + .8) * amp;

        vec4 cr = readTex(src, uvr);
        vec4 cg = readTex(src, uvg);
        vec4 cb = readTex(src, uvb);

        return vec4(
            cr.r,
            cg.g,
            cb.b,
            cr.a + cg.a + cb.a
        );
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        // x blur
        vec2 dx = vec2(2, 0) / resolution.x;
        outColor = (draw(uv) * 2. + draw(uv + dx) + draw(uv - dx)) / 4.;
    }
    `,shine:`
    ${O}
    ${X}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        vec2 p = uv * 2. - 1.;
        float a = atan(p.y, p.x);

        vec4 col = readTex(src, uv);
        float gray = length(col.rgb);

        float level = 1. + sin(a * 10. + time * 3.) * 0.2;

        outColor = vec4(1, 1, .5, col.a) * level;
    }
    `,blink:`
    ${O}
    ${X}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        outColor = readTex(src, uv) * (sin(time * 5.) * 0.2 + 0.8);
    }

    `,spring:`
    ${O}
    ${X}

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        uv = (uv - .5) * (1.05 + sin(time * 5.) * 0.05) + .5;
        outColor = readTex(src, uv);
    }
    `,duotone:`
    ${O}
    ${X}

    uniform vec4 color1;
    uniform vec4 color2;
    uniform float speed;

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);

        float gray = dot(color.rgb, vec3(0.2, 0.7, 0.08));
        float t = mod(gray * 2.0 + time * speed, 2.0);

        if (t < 1.) {
            outColor = mix(color1, color2, fract(t));
        } else {
            outColor = mix(color2, color1, fract(t));
        }

        outColor.a *= color.a;
    }
    `,tritone:`
    ${O}
    ${X}

    uniform vec4 color1;
    uniform vec4 color2;
    uniform vec4 color3;
    uniform float speed;

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);

        float gray = dot(color.rgb, vec3(0.2, 0.7, 0.08));
        float t = mod(gray * 3.0 + time * speed, 3.0);

        if (t < 1.) {
            outColor = mix(color1, color2, fract(t));
        } else if (t < 2.) {
            outColor = mix(color2, color3, fract(t));
        } else {
            outColor = mix(color3, color1, fract(t));
        }

        outColor.a *= color.a;
    }
    `,hueShift:`
    ${O}
    ${X}

    uniform float shift;

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hueShift(vec3 rgb, float t) {
        vec3 hsv = rgb2hsv(rgb);
        hsv.x = fract(hsv.x + t);
        return hsv2rgb(hsv);
    }

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);
        color.rgb = hueShift(color.rgb, shift);
        outColor = color;
    }
    `,warpTransition:`
    ${O}
    uniform float enterTime;
    uniform float leaveTime;

    ${X}

    #define DURATION 1.0

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float t1 = enterTime / DURATION;
        float t2 = leaveTime / DURATION;
        float t = clamp(min(t1, 1. - t2), 0., 1.);

        if (t == 0.) {
            discard;
        }

        if (t < 1.) {
            uv.x += sin(floor(uv.y * 300.)) * 3. * exp(t * -10.);
        }

        outColor = readTex(src, uv);
    }
    `,slitScanTransition:`
    ${O}
    ${X}

    uniform float enterTime;
    uniform float leaveTime;

    #define DURATION 1.0

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float t1 = enterTime / DURATION;
        float t2 = leaveTime / DURATION;

        // Do not render before enter or after leave
        if (t1 < 0. || 1. < t2) {
            discard;
        }

        if (0. < t2) {
            // Leaving
            float t = 1. - t2;
            uv.y = uv.y < t ? uv.y : t;
        } else if (t1 < 1.) {
            // Entering
            float t = 1. - t1;
            uv.y = uv.y < t ? t : uv.y;
        }

        outColor = readTex(src, uv);
    }
    `,pixelateTransition:`
    ${O}
    ${X}

    uniform float enterTime;
    uniform float leaveTime;

    #define DURATION 1.0

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        float t1 = enterTime / DURATION;
        float t2 = leaveTime / DURATION;
        float t = clamp(min(t1, 1. - t2), 0., 1.);

        if (t == 0.) {
            discard;
        } else if (t < 1.) {
            float b = floor(t * 64.);
            uv = (floor(uv * b) + .5) / b;
        }

        outColor = readTex(src, uv);
    }
    `,focusTransition:`
    ${O}
    ${X}

    uniform float intersection;

    void main (void) {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        float t = smoothstep(0., 1., intersection);

        outColor = mix(
            readTex(src, uv + vec2(1. - t, 0)),
            readTex(src, uv + vec2(-(1. - t), 0)),
            0.5
        ) * intersection;
    }
    `,invert:`
    ${O}
    ${X}

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);
        outColor = vec4(1.0 - color.rgb, color.a);
    }
    `,grayscale:`
    ${O}
    ${X}

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        vec4 color = readTex(src, uv);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        outColor = vec4(vec3(gray), color.a);
    }
    `,vignette:`
    ${O}
    ${X}

    uniform float intensity;
    uniform float radius;
    uniform float power;

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;
        outColor = readTex(src, uv);

        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;

        float l = max(length(p) - radius, 0.);
        outColor *= 1. - pow(l, power) * intensity;
    }
    `,chromatic:`
    ${O}
    ${X}

    uniform float intensity;
    uniform float radius;
    uniform float power;


    vec4 mirrorTex(sampler2D tex, vec2 uv) {
        vec2 uv2 = 1. - abs(1. - mod(uv, 2.0));
        return texture(tex, uv2);
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - offset) / resolution;

        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;

        float l = max(length(p) - radius, 0.);
        float d = pow(l, power) * (intensity * 0.1);

        vec2 uvR = (uv - .5) / (1.0 + d * 1.) + 0.5;
        vec2 uvG = (uv - .5) / (1.0 + d * 2.) + 0.5;
        vec2 uvB = (uv - .5) / (1.0 + d * 3.) + 0.5;

        vec4 cr = mirrorTex(src, uvR);
        vec4 cg = mirrorTex(src, uvG);
        vec4 cb = mirrorTex(src, uvB);

        outColor = vec4(cr.r, cg.g, cb.b, (cr.a + cg.a + cb.a) / 3.0);
    }
    `};function Xi(s){if(!s.src||s.src.startsWith("data:"))return!1;try{return new URL(s.src,location.href).origin!==location.origin}catch{return!1}}async function Di(s){let t=await(await fetch(s)).blob();return URL.createObjectURL(t)}async function Hi(s){let t=Array.from(s.querySelectorAll("img")).filter(n=>n.complete&&n.naturalWidth>0&&Xi(n));if(t.length===0)return()=>{};let r=new Map,i=[];return await Promise.all(t.map(async n=>{try{let a=await Di(n.src);r.set(n,n.src),i.push(a),await new Promise(f=>{n.addEventListener("load",()=>f(),{once:!0}),n.src=a})}catch{}})),()=>{for(let[n,a]of r)n.src=a;for(let n of i)URL.revokeObjectURL(n)}}var Ni=["margin-top","margin-right","margin-bottom","margin-left"],Gi=["position","top","right","bottom","left","float","flex","flex-grow","flex-shrink","flex-basis","align-self","justify-self","place-self","order","grid-column","grid-column-start","grid-column-end","grid-row","grid-row-start","grid-row-end","grid-area"],ss=new WeakMap,is=new WeakMap,os=new WeakMap,ns=new WeakMap,as=new WeakMap,fs=new WeakMap;async function Vs(s,e){let t=s.getContext("2d");if(!t)throw new Error("Failed to get 2d context from layoutsubtree canvas");let{onCapture:r,maxSize:i}=e,n=null,a=null,f=new Promise(d=>{a=d});s.onpaint=()=>{let d=s.firstElementChild;if(!d||s.width===0||s.height===0)return;t.clearRect(0,0,s.width,s.height),t.drawElementImage(d,0,0);let h=s.width,p=s.height;if(i&&(h>i||p>i)){let w=Math.min(i/h,i/p);h=Math.floor(h*w),p=Math.floor(p*w)}(!n||n.width!==h||n.height!==p)&&(n=new OffscreenCanvas(h,p));let v=n.getContext("2d");if(v){if(v.clearRect(0,0,h,p),v.drawImage(s,0,0,h,p),t.clearRect(0,0,s.width,s.height),a){a(n),a=null;return}r(n)}};let c=new ResizeObserver(d=>{for(let h of d){let p=h.devicePixelContentBoxSize?.[0];if(p)s.width=p.inlineSize,s.height=p.blockSize;else{let v=h.borderBoxSize?.[0];if(v){let w=window.devicePixelRatio;s.width=Math.round(v.inlineSize*w),s.height=Math.round(v.blockSize*w)}}}s.requestPaint()});c.observe(s,{box:"device-pixel-content-box"}),ss.set(s,c);let l=s.firstElementChild,u="";if(l){let d=new ResizeObserver(h=>{let p=h[0].borderBoxSize?.[0];if(!p)return;let v=`${Math.round(p.blockSize)}px`;v!==u&&(u=v,s.style.setProperty("height",v))});d.observe(l),is.set(s,d)}return f}function Is(s){s.onpaint=null;let e=ss.get(s);e&&(e.disconnect(),ss.delete(s));let t=is.get(s);t&&(t.disconnect(),is.delete(s))}async function Us(s,e){let t=s.getBoundingClientRect(),r=document.createElement("canvas");r.setAttribute("layoutsubtree",""),r.className=s.className;let i=s.getAttribute("style");i&&r.setAttribute("style",i),r.style.setProperty("padding","0"),r.style.setProperty("border","none"),r.style.setProperty("box-sizing","content-box"),r.style.setProperty("background","transparent");let n=getComputedStyle(s),a=n.display==="inline"?"block":n.display;r.style.setProperty("display",a);for(let u of Ni)r.style.setProperty(u,n.getPropertyValue(u));for(let u of Gi)r.style.setProperty(u,n.getPropertyValue(u));s.style.width.endsWith("px")?r.style.setProperty("width",`${t.width}px`):r.style.setProperty("width","100%"),r.style.height||r.style.setProperty("height",`${t.height}px`);let f=window.devicePixelRatio;r.width=Math.round(t.width*f),r.height=Math.round(t.height*f),os.set(s,s.style.margin),ns.set(s,s.style.width),as.set(s,s.style.boxSizing),s.parentNode?.insertBefore(r,s),r.appendChild(s),s.style.setProperty("margin","0"),s.style.setProperty("width","100%"),s.style.setProperty("box-sizing","border-box");let c=await Hi(s);fs.set(r,c);let l=await Vs(r,e);return{canvas:r,initialCapture:l}}function cs(s,e){Is(s);let t=fs.get(s);t&&(t(),fs.delete(s)),s.parentNode?.insertBefore(e,s),s.remove();let r=os.get(e);r!==void 0&&(e.style.margin=r,os.delete(e));let i=ns.get(e);i!==void 0&&(e.style.width=i,ns.delete(e));let n=as.get(e);n!==void 0&&(e.style.boxSizing=n,as.delete(e))}var Pt;function ls(){if(Pt!==void 0)return Pt;try{let s=document.createElement("canvas"),e=s.getContext("2d");Pt=e!==null&&typeof e.drawElementImage=="function"&&typeof s.requestPaint=="function"}catch{Pt=!1}return Pt}function ks(s){let e=typeof window<"u"?window.devicePixelRatio:1,t;s.scrollPadding===void 0?t=[.1,.1]:s.scrollPadding===!1?t=[0,0]:Array.isArray(s.scrollPadding)?t=[s.scrollPadding[0]??.1,s.scrollPadding[1]??.1]:t=[s.scrollPadding,s.scrollPadding];let r;return s.postEffect===void 0?r=[]:Array.isArray(s.postEffect)?r=s.postEffect:r=[s.postEffect],{pixelRatio:s.pixelRatio??e,zIndex:s.zIndex??void 0,autoplay:s.autoplay??!0,fixedCanvas:s.scrollPadding===!1,scrollPadding:t,wrapper:s.wrapper,postEffects:r}}var Ze=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},me=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},tt,rr,rt,Ft,et,hs,Ws,Bs,U=class{constructor(e,t,r){tt.add(this),this.wrapS="clamp",this.wrapT="clamp",this.minFilter="linear",this.magFilter="linear",this.needsUpdate=!0,this.source=null,rr.set(this,void 0),rt.set(this,!1),Ft.set(this,void 0),et.set(this,void 0),Ze(this,rr,e,"f"),this.gl=e.gl;let i=r?.externalHandle;Ze(this,et,i!==void 0,"f"),i!==void 0?(this.texture=i,Ze(this,rt,!0,"f"),this.needsUpdate=!1):me(this,tt,"m",hs).call(this),t&&(this.source=t),Ze(this,Ft,r?.autoRegister!==!1&&!me(this,et,"f"),"f"),me(this,Ft,"f")&&e.addResource(this)}restore(){me(this,et,"f")||(me(this,tt,"m",hs).call(this),Ze(this,rt,!1,"f"),this.needsUpdate=!0)}bind(e){let t=this.gl;t.activeTexture(t.TEXTURE0+e),t.bindTexture(t.TEXTURE_2D,this.texture),this.needsUpdate&&(me(this,tt,"m",Ws).call(this),this.needsUpdate=!1)}dispose(){me(this,Ft,"f")&&me(this,rr,"f").removeResource(this),me(this,et,"f")||this.gl.deleteTexture(this.texture)}};rr=new WeakMap,rt=new WeakMap,Ft=new WeakMap,et=new WeakMap,tt=new WeakSet,hs=function(){let e=this.gl.createTexture();if(!e)throw new Error("[VFX-JS] Failed to create texture");this.texture=e},Ws=function(){let e=this.gl,t=this.source;if(e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_ALIGNMENT,4),t)try{e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t)}catch(r){console.error(r)}else if(!me(this,rt,"f")){let r=new Uint8Array([0,0,0,0]);e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,r)}me(this,tt,"m",Bs).call(this),Ze(this,rt,!0,"f")},Bs=function(){let e=this.gl;e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,Ls(e,this.wrapS)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,Ls(e,this.wrapT)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,zs(e,this.minFilter)),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,zs(e,this.magFilter))};function Ls(s,e){return e==="repeat"?s.REPEAT:e==="mirror"?s.MIRRORED_REPEAT:s.CLAMP_TO_EDGE}function zs(s,e){return e==="nearest"?s.NEAREST:s.LINEAR}function sr(s){return new Promise((e,t)=>{let r=new Image;r.crossOrigin="anonymous",r.onload=()=>e(r),r.onerror=t,r.src=s})}var $i=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},St=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},Rt,Ct,ir,ve=class{constructor(e,t,r,i={}){Rt.add(this),Ct.set(this,void 0),$i(this,Ct,e,"f"),this.gl=e.gl,this.width=Math.max(1,Math.floor(t)),this.height=Math.max(1,Math.floor(r)),this.float=i.float??!1,this.mipmap=i.mipmap??!1,this.texture=new U(e,void 0,{autoRegister:!1});let n=i.wrap;n!==void 0&&(typeof n=="string"?(this.texture.wrapS=n,this.texture.wrapT=n):(this.texture.wrapS=n[0],this.texture.wrapT=n[1])),i.filter!==void 0&&(this.texture.minFilter=i.filter,this.texture.magFilter=i.filter),St(this,Rt,"m",ir).call(this),e.addResource(this)}setSize(e,t){let r=Math.max(1,Math.floor(e)),i=Math.max(1,Math.floor(t));r===this.width&&i===this.height||(this.width=r,this.height=i,St(this,Rt,"m",ir).call(this))}restore(){this.texture.restore(),St(this,Rt,"m",ir).call(this)}dispose(){St(this,Ct,"f").removeResource(this),this.gl.deleteFramebuffer(this.fbo),this.texture.dispose()}generateMipmaps(){if(!this.mipmap)return;let e=this.gl;e.bindTexture(e.TEXTURE_2D,this.texture.texture),e.generateMipmap(e.TEXTURE_2D),e.bindTexture(e.TEXTURE_2D,null)}};Ct=new WeakMap,Rt=new WeakSet,ir=function(){let e=this.gl,t=this.fbo,r=e.createFramebuffer();if(!r)throw new Error("[VFX-JS] Failed to create framebuffer");this.fbo=r;let i=this.texture.texture;e.bindTexture(e.TEXTURE_2D,i);let n=St(this,Ct,"f").floatLinearFilter,a=this.float?n?e.RGBA32F:e.RGBA16F:e.RGBA8,f=this.float?n?e.FLOAT:e.HALF_FLOAT:e.UNSIGNED_BYTE;if(this.mipmap){let p=Math.floor(Math.log2(Math.max(this.width,this.height)))+1,v=this.width,w=this.height;for(let F=0;F<p;F++)e.texImage2D(e.TEXTURE_2D,F,a,v,w,0,e.RGBA,f,null),v=Math.max(1,v>>1),w=Math.max(1,w>>1)}else e.texImage2D(e.TEXTURE_2D,0,a,this.width,this.height,0,e.RGBA,f,null);let c=this.texture.minFilter==="nearest"?e.NEAREST:e.LINEAR,l=this.texture.magFilter==="nearest"?e.NEAREST:e.LINEAR,u=this.mipmap?this.texture.minFilter==="nearest"?e.NEAREST_MIPMAP_NEAREST:e.LINEAR_MIPMAP_LINEAR:c,d=Os(e,this.texture.wrapS),h=Os(e,this.texture.wrapT);e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,u),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,l),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,d),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,h),e.bindFramebuffer(e.FRAMEBUFFER,r),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,i,0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindTexture(e.TEXTURE_2D,null),this.texture.needsUpdate=!1,this.texture.source=null,t&&e.deleteFramebuffer(t)};function Os(s,e){return e==="repeat"?s.REPEAT:e==="mirror"?s.MIRRORED_REPEAT:s.CLAMP_TO_EDGE}function or(s,e,t,r){return{x:s.left+t,y:e-r-s.bottom,w:s.right-s.left,h:s.bottom-s.top}}function Ie(s,e,t,r){return{x:s,y:e,w:t,h:r}}var De=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},oe=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},st,it,Mt,le,Fe=class{constructor(e,t,r,i,n,a={}){st.set(this,void 0),it.set(this,void 0),Mt.set(this,void 0),le.set(this,void 0),De(this,st,t,"f"),De(this,it,r,"f"),De(this,Mt,i,"f");let f=t*i,c=r*i,l={float:n,wrap:a.wrap,filter:a.filter,mipmap:a.mipmap};De(this,le,[new ve(e,f,c,l),new ve(e,f,c,l)],"f")}get texture(){return oe(this,le,"f")[0].texture}get target(){return oe(this,le,"f")[1]}resize(e,t){if(e===oe(this,st,"f")&&t===oe(this,it,"f"))return;De(this,st,e,"f"),De(this,it,t,"f");let r=e*oe(this,Mt,"f"),i=t*oe(this,Mt,"f");oe(this,le,"f")[0].setSize(r,i),oe(this,le,"f")[1].setSize(r,i)}swap(){De(this,le,[oe(this,le,"f")[1],oe(this,le,"f")[0]],"f")}getViewport(){return Ie(0,0,oe(this,st,"f"),oe(this,it,"f"))}dispose(){oe(this,le,"f")[0].dispose(),oe(this,le,"f")[1].dispose()}};st=new WeakMap,it=new WeakMap,Mt=new WeakMap,le=new WeakMap;var te=class{constructor(e=0,t=0){this.x=0,this.y=0,this.x=e,this.y=t}set(e,t){return this.x=e,this.y=t,this}},ge=class{constructor(e=0,t=0,r=0,i=0){this.x=0,this.y=0,this.z=0,this.w=0,this.x=e,this.y=t,this.z=r,this.w=i}set(e,t,r,i){return this.x=e,this.y=t,this.z=r,this.w=i,this}};var nr=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},we=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},ar,fr,cr,lr,At,ot,us;function ds(s){return/#version\s+300\s+es\b/.test(s)?"300 es":/#version\s+100\b/.test(s)||/\bgl_FragColor\b|\btexture2D\b|\bvarying\b|\battribute\b/.test(s)?"100":"300 es"}var nt=class{constructor(e,t,r,i){ar.add(this),fr.set(this,void 0),cr.set(this,void 0),lr.set(this,void 0),At.set(this,void 0),ot.set(this,new Map),nr(this,fr,e,"f"),this.gl=e.gl,nr(this,cr,t,"f"),nr(this,lr,r,"f"),nr(this,At,i??ds(r),"f"),we(this,ar,"m",us).call(this),e.addResource(this)}restore(){we(this,ar,"m",us).call(this)}use(){this.gl.useProgram(this.program)}hasUniform(e){return we(this,ot,"f").has(e)}uploadUniforms(e){let t=this.gl,r=0;for(let[i,n]of we(this,ot,"f")){let a=e[i];if(!a)continue;let f=a.value;if(f!=null){if(ji(n.type)){f instanceof U&&(f.bind(r),t.uniform1i(n.location,r),r++);continue}f instanceof U||qi(t,n,f)}}}dispose(){we(this,fr,"f").removeResource(this),this.gl.deleteProgram(this.program)}};fr=new WeakMap,cr=new WeakMap,lr=new WeakMap,At=new WeakMap,ot=new WeakMap,ar=new WeakSet,us=function(){let e=this.gl,t=Xs(e,e.VERTEX_SHADER,Ds(we(this,cr,"f"),we(this,At,"f"))),r=Xs(e,e.FRAGMENT_SHADER,Ds(we(this,lr,"f"),we(this,At,"f"))),i=e.createProgram();if(!i)throw new Error("[VFX-JS] Failed to create program");if(e.attachShader(i,t),e.attachShader(i,r),e.bindAttribLocation(i,0,"position"),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS)){let a=e.getProgramInfoLog(i)??"";throw e.deleteShader(t),e.deleteShader(r),e.deleteProgram(i),new Error(`[VFX-JS] Program link failed: ${a}`)}e.detachShader(i,t),e.detachShader(i,r),e.deleteShader(t),e.deleteShader(r),this.program=i,we(this,ot,"f").clear();let n=e.getProgramParameter(i,e.ACTIVE_UNIFORMS);for(let a=0;a<n;a++){let f=e.getActiveUniform(i,a);if(!f)continue;let c=f.name.replace(/\[0\]$/,""),l=e.getUniformLocation(i,f.name);l&&we(this,ot,"f").set(c,{location:l,type:f.type,size:f.size})}};function Xs(s,e,t){let r=s.createShader(e);if(!r)throw new Error("[VFX-JS] Failed to create shader");if(s.shaderSource(r,t),s.compileShader(r),!s.getShaderParameter(r,s.COMPILE_STATUS)){let i=s.getShaderInfoLog(r)??"";throw s.deleteShader(r),new Error(`[VFX-JS] Shader compile failed: ${i}

${t}`)}return r}function Ds(s,e){return s.replace(/^\s+/,"").startsWith("#version")||e==="100"?s:`#version 300 es
${s}`}function ji(s){return s===35678||s===36298||s===36306||s===35682}var Hs=new Set;function qi(s,e,t){let r=e.location,i=e.size>1,n=t,a=t,f=t;switch(e.type){case s.FLOAT:i?s.uniform1fv(r,n):s.uniform1f(r,t);return;case s.FLOAT_VEC2:if(i)s.uniform2fv(r,n);else if(t instanceof te)s.uniform2f(r,t.x,t.y);else{let c=t;s.uniform2f(r,c[0],c[1])}return;case s.FLOAT_VEC3:if(i)s.uniform3fv(r,n);else{let c=t;s.uniform3f(r,c[0],c[1],c[2])}return;case s.FLOAT_VEC4:if(i)s.uniform4fv(r,n);else if(t instanceof ge)s.uniform4f(r,t.x,t.y,t.z,t.w);else{let c=t;s.uniform4f(r,c[0],c[1],c[2],c[3])}return;case s.INT:i?s.uniform1iv(r,a):s.uniform1i(r,t);return;case s.INT_VEC2:if(i)s.uniform2iv(r,a);else{let c=t;s.uniform2i(r,c[0],c[1])}return;case s.INT_VEC3:if(i)s.uniform3iv(r,a);else{let c=t;s.uniform3i(r,c[0],c[1],c[2])}return;case s.INT_VEC4:if(i)s.uniform4iv(r,a);else{let c=t;s.uniform4i(r,c[0],c[1],c[2],c[3])}return;case s.BOOL:i?s.uniform1iv(r,a):s.uniform1i(r,t?1:0);return;case s.BOOL_VEC2:if(i)s.uniform2iv(r,a);else{let c=t;s.uniform2i(r,c[0]?1:0,c[1]?1:0)}return;case s.BOOL_VEC3:if(i)s.uniform3iv(r,a);else{let c=t;s.uniform3i(r,c[0]?1:0,c[1]?1:0,c[2]?1:0)}return;case s.BOOL_VEC4:if(i)s.uniform4iv(r,a);else{let c=t;s.uniform4i(r,c[0]?1:0,c[1]?1:0,c[2]?1:0,c[3]?1:0)}return;case s.FLOAT_MAT2:s.uniformMatrix2fv(r,!1,n);return;case s.FLOAT_MAT3:s.uniformMatrix3fv(r,!1,n);return;case s.FLOAT_MAT4:s.uniformMatrix4fv(r,!1,n);return;case s.UNSIGNED_INT:i?s.uniform1uiv(r,f):s.uniform1ui(r,t);return;case s.UNSIGNED_INT_VEC2:if(i)s.uniform2uiv(r,f);else{let c=t;s.uniform2ui(r,c[0],c[1])}return;case s.UNSIGNED_INT_VEC3:if(i)s.uniform3uiv(r,f);else{let c=t;s.uniform3ui(r,c[0],c[1],c[2])}return;case s.UNSIGNED_INT_VEC4:if(i)s.uniform4uiv(r,f);else{let c=t;s.uniform4ui(r,c[0],c[1],c[2],c[3])}return;default:Hs.has(e.type)||(Hs.add(e.type),console.warn(`[VFX-JS] Unsupported uniform type 0x${e.type.toString(16)}; skipping upload.`));return}}var at=class{constructor(e,t,r,i,n,a){this.gl=e.gl,this.program=new nt(e,t,r,a),this.uniforms=i,this.blend=n}dispose(){this.program.dispose()}};function Ns(s,e,t,r,i,n,a,f){let c=r?r.width/f:n,l=r?r.height/f:a,u=Math.max(0,i.x),d=Math.max(0,i.y),h=Math.min(c,i.x+i.w),p=Math.min(l,i.y+i.h),v=h-u,w=p-d;v<=0||w<=0||(s.bindFramebuffer(s.FRAMEBUFFER,r?r.fbo:null),s.viewport(Math.round(u*f),Math.round(d*f),Math.round(v*f),Math.round(w*f)),ps(s,t.blend),t.program.use(),t.program.uploadUniforms(t.uniforms),e.draw())}function ps(s,e){if(e==="none"){s.disable(s.BLEND);return}s.enable(s.BLEND),s.blendEquation(s.FUNC_ADD),e==="premultiplied"?s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA):e==="additive"?s.blendFuncSeparate(s.ONE,s.ONE,s.ONE,s.ONE):s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA)}var hr=class{constructor(e){this.uniforms={src:{value:null},offset:{value:new te},resolution:{value:new te},viewport:{value:new ge}},this.pass=new at(e,tr,ts,this.uniforms,"premultiplied")}setUniforms(e,t,r){this.uniforms.src.value=e,this.uniforms.resolution.value.set(r.w*t,r.h*t),this.uniforms.offset.value.set(r.x*t,r.y*t)}dispose(){this.pass.dispose()}};var Ji=s=>{let e=document.implementation.createHTMLDocument("test"),t=e.createRange();t.selectNodeContents(e.documentElement),t.deleteContents();let r=document.createElement("head");return e.documentElement.appendChild(r),e.documentElement.appendChild(t.createContextualFragment(s)),e.documentElement.setAttribute("xmlns",e.documentElement.namespaceURI),new XMLSerializer().serializeToString(e).replace(/<!DOCTYPE html>/,"")};async function Vt(s,e,t,r){let i=s.getBoundingClientRect(),n=window.devicePixelRatio,a=Math.ceil(i.width),f=Math.ceil(i.height),c=a*n,l=f*n,u=1,d=c,h=l;r&&(d>r||h>r)&&(u=Math.min(r/d,r/h),d=Math.floor(d*u),h=Math.floor(h*u));let p=t&&t.width===d&&t.height===h?t:new OffscreenCanvas(d,h),v=s.cloneNode(!0);await Gs(s,v),$s(s,v),v.style.setProperty("opacity",e.toString()),v.style.setProperty("margin","0px"),Yi(v),v.style.setProperty("box-sizing","border-box"),v.style.setProperty("width",`${a}px`),v.style.setProperty("height",`${f}px`);let w=v.outerHTML,F=Ji(w),M=`<svg xmlns="http://www.w3.org/2000/svg" width="${c}" height="${l}"><foreignObject width="100%" height="100%">${F}</foreignObject></svg>`;return new Promise((y,E)=>{let _=new Image;_.onload=()=>{let S=p.getContext("2d");if(S===null)return E();S.clearRect(0,0,d,h);let W=n*u;S.scale(W,W),S.drawImage(_,0,0,c,l),S.setTransform(1,0,0,1,0,0),y(p)},_.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(M)}`})}async function Gs(s,e){let t=window.getComputedStyle(s);for(let r of Array.from(t))/(-inline-|-block-|^inline-|^block-)/.test(r)||/^-webkit-.*(start|end|before|after|logical)/.test(r)||e.style.setProperty(r,t.getPropertyValue(r),t.getPropertyPriority(r));if(e.tagName==="INPUT")e.setAttribute("value",e.value);else if(e.tagName==="TEXTAREA")e.innerHTML=e.value;else if(e.tagName==="IMG")try{e.src=await Ki(s.src)}catch{}for(let r=0;r<s.children.length;r++){let i=s.children[r],n=e.children[r];await Gs(i,n)}}function $s(s,e){if(typeof s.computedStyleMap=="function")try{let t=s.computedStyleMap();for(let r of["margin-top","margin-right","margin-bottom","margin-left"]){let i=t.get(r);i instanceof CSSKeywordValue&&i.value==="auto"&&e.style.setProperty(r,"auto")}}catch{}for(let t=0;t<s.children.length;t++){let r=s.children[t],i=e.children[t];r instanceof HTMLElement&&i instanceof HTMLElement&&$s(r,i)}}function Yi(s){let e=s;for(;;){let t=e.style;if(Number.parseFloat(t.paddingTop)>0||Number.parseFloat(t.borderTopWidth)>0||t.getPropertyValue("overflow-x")&&t.getPropertyValue("overflow-x")!=="visible"||t.getPropertyValue("overflow-y")&&t.getPropertyValue("overflow-y")!=="visible"||t.display==="flex"||t.display==="grid"||t.display==="flow-root"||t.display==="inline-block")break;let r=e.firstElementChild;if(!r)break;r.style.setProperty("margin-top","0px"),e=r}for(e=s;;){let t=e.style;if(Number.parseFloat(t.paddingBottom)>0||Number.parseFloat(t.borderBottomWidth)>0||t.getPropertyValue("overflow-x")&&t.getPropertyValue("overflow-x")!=="visible"||t.getPropertyValue("overflow-y")&&t.getPropertyValue("overflow-y")!=="visible"||t.display==="flex"||t.display==="grid"||t.display==="flow-root"||t.display==="inline-block")break;let r=e.lastElementChild;if(!r)break;r.style.setProperty("margin-bottom","0px"),e=r}}async function Ki(s){let e=await fetch(s).then(t=>t.blob());return new Promise(t=>{let r=new FileReader;r.onload=function(){t(this.result)},r.readAsDataURL(e)})}var he=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},N=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},ur,dr,ft,gr,ct,Ue,It,ms,pr,mr,vr,Ut,yr=Object.freeze({__brand:"EffectQuad"});function js(s){return s===yr}function Qi(s,e){switch(e){case"lines":return s.LINES;case"lineStrip":return s.LINE_STRIP;case"points":return s.POINTS;default:return s.TRIANGLES}}function Zi(s,e){if(e instanceof Float32Array)return s.FLOAT;if(e instanceof Uint8Array)return s.UNSIGNED_BYTE;if(e instanceof Uint16Array)return s.UNSIGNED_SHORT;if(e instanceof Uint32Array)return s.UNSIGNED_INT;if(e instanceof Int8Array)return s.BYTE;if(e instanceof Int16Array)return s.SHORT;if(e instanceof Int32Array)return s.INT;throw new Error("[VFX-JS] Unsupported attribute typed array")}function eo(s,e){if(ArrayBuffer.isView(e)&&!(e instanceof DataView))return{name:s,data:e,itemSize:2,normalized:!1,perInstance:!1};let t=e;return{name:s,data:t.data,itemSize:t.itemSize,normalized:t.normalized??!1,perInstance:t.perInstance??!1}}var vs=class{constructor(e,t,r){ur.add(this),dr.set(this,void 0),ft.set(this,void 0),gr.set(this,void 0),ct.set(this,[]),Ue.set(this,null),this.indexType=0,this.hasIndices=!1,this.drawCount=0,this.drawStart=0,It.set(this,!1),he(this,dr,e,"f"),this.gl=e.gl,he(this,ft,t,"f"),he(this,gr,r,"f"),this.mode=Qi(this.gl,t.mode),this.instanceCount=t.instanceCount??0,N(this,ur,"m",ms).call(this),e.addResource(this),he(this,It,!0,"f")}restore(){he(this,ct,[],"f"),he(this,Ue,null,"f"),N(this,ur,"m",ms).call(this)}draw(){let e=this.gl;e.bindVertexArray(this.vao),this.hasIndices?this.instanceCount>0?e.drawElementsInstanced(this.mode,this.drawCount,this.indexType,this.drawStart*(this.indexType===e.UNSIGNED_INT?4:2),this.instanceCount):e.drawElements(this.mode,this.drawCount,this.indexType,this.drawStart*(this.indexType===e.UNSIGNED_INT?4:2)):this.instanceCount>0?e.drawArraysInstanced(this.mode,this.drawStart,this.drawCount,this.instanceCount):e.drawArrays(this.mode,this.drawStart,this.drawCount)}dispose(){N(this,It,"f")&&(N(this,dr,"f").removeResource(this),he(this,It,!1,"f"));let e=this.gl;e.deleteVertexArray(this.vao);for(let t of N(this,ct,"f"))e.deleteBuffer(t);N(this,Ue,"f")&&e.deleteBuffer(N(this,Ue,"f")),he(this,ct,[],"f"),he(this,Ue,null,"f")}};dr=new WeakMap,ft=new WeakMap,gr=new WeakMap,ct=new WeakMap,Ue=new WeakMap,It=new WeakMap,ur=new WeakSet,ms=function(){let e=this.gl,t=e.createVertexArray();if(!t)throw new Error("[VFX-JS] Failed to create VAO");this.vao=t,e.bindVertexArray(t);let r=N(this,gr,"f").program,i=null;for(let[l,u]of Object.entries(N(this,ft,"f").attributes)){let d=eo(l,u),h=e.getAttribLocation(r,d.name);if(h<0)continue;let p=e.createBuffer();if(!p)throw new Error(`[VFX-JS] Failed to create VBO for "${d.name}"`);N(this,ct,"f").push(p),e.bindBuffer(e.ARRAY_BUFFER,p),e.bufferData(e.ARRAY_BUFFER,d.data,e.STATIC_DRAW);let v=Zi(e,d.data);e.enableVertexAttribArray(h),v===e.FLOAT||v===e.HALF_FLOAT||d.normalized?e.vertexAttribPointer(h,d.itemSize,v,d.normalized,0,0):e.vertexAttribIPointer(h,d.itemSize,v,0,0),d.perInstance&&e.vertexAttribDivisor(h,1),l==="position"&&i===null&&(i=d.data.length/d.itemSize)}let n=0,a=N(this,ft,"f").indices;if(a){let l=e.createBuffer();if(!l)throw new Error("[VFX-JS] Failed to create IBO");he(this,Ue,l,"f"),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,l),e.bufferData(e.ELEMENT_ARRAY_BUFFER,a,e.STATIC_DRAW),this.hasIndices=!0,this.indexType=a instanceof Uint32Array?e.UNSIGNED_INT:e.UNSIGNED_SHORT,n=a.length}else this.hasIndices=!1;e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null),N(this,Ue,"f")&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,null);let f=this.hasIndices?n:i??0,c=N(this,ft,"f").drawRange;this.drawStart=c?.start??0,this.drawCount=c?.count!==void 0?c.count:Math.max(0,f-this.drawStart)};var wr=class{constructor(e,t){pr.set(this,void 0),mr.set(this,void 0),vr.set(this,new WeakMap),Ut.set(this,new Set),he(this,pr,e,"f"),he(this,mr,t,"f")}get quad(){return N(this,mr,"f")}resolve(e,t){let r=N(this,vr,"f").get(e);r||(r=new Map,N(this,vr,"f").set(e,r));let i=r.get(t);return i||(i=new vs(N(this,pr,"f"),e,t),r.set(t,i),N(this,Ut,"f").add(i)),i}dispose(){for(let e of N(this,Ut,"f"))e.dispose();N(this,Ut,"f").clear()}};pr=new WeakMap,mr=new WeakMap,vr=new WeakMap,Ut=new WeakMap;var $=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},g=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},ye,ke,ht,ut,xr,dt,Bt,He,Ne,kt,_e,lt,j,K,Ks,qs,Qs,Lt,Zs,ei,_r,Js,ti=Symbol.for("@vfx-js/effect.resolve-texture"),ri=Symbol.for("@vfx-js/effect.resolve-rt");function to(s){return s[ti]()}function gs(s){return s[ri]}var ro=`#version 300 es
precision highp float;
in vec3 position;
out vec2 uv;
out vec2 uvContent;
out vec2 uvSrc;
uniform vec4 contentRectUv;
uniform vec4 srcRectUv;
void main() {
    vec2 bufferUV = position.xy * 0.5 + 0.5;
    uv = bufferUV;
    uvContent = (bufferUV - contentRectUv.xy) / contentRectUv.zw;
    uvSrc = srcRectUv.xy + uvContent * srcRectUv.zw;
    gl_Position = vec4(position, 1.0);
}
`,so=`
precision highp float;
attribute vec3 position;
varying vec2 uv;
varying vec2 uvContent;
varying vec2 uvSrc;
uniform vec4 contentRectUv;
uniform vec4 srcRectUv;
void main() {
    vec2 bufferUV = position.xy * 0.5 + 0.5;
    uv = bufferUV;
    uvContent = (bufferUV - contentRectUv.xy) / contentRectUv.zw;
    uvSrc = srcRectUv.xy + uvContent * srcRectUv.zw;
    gl_Position = vec4(position, 1.0);
}
`,io=`#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
uniform sampler2D src;
void main() {
    outColor = texture(src, uv);
}
`,oo=`
precision highp float;
varying vec2 uv;
uniform sampler2D src;
void main() {
    gl_FragColor = texture2D(src, uv);
}
`,no=`#version 300 es
precision highp float;
in vec2 uvSrc;
out vec4 outColor;
uniform sampler2D src;
void main() {
    outColor = texture(src, uvSrc);
}
`,ao=`
precision highp float;
varying vec2 uvSrc;
uniform sampler2D src;
void main() {
    gl_FragColor = texture2D(src, uvSrc);
}
`,br=class{constructor(e,t,r,i,n,a){ye.add(this),ke.set(this,void 0),ht.set(this,void 0),ut.set(this,void 0),xr.set(this,void 0),dt.set(this,void 0),Bt.set(this,[]),He.set(this,[]),Ne.set(this,[]),kt.set(this,[]),_e.set(this,"init"),lt.set(this,!1),j.set(this,void 0),K.set(this,void 0),Lt.set(this,[]),$(this,ke,e,"f"),$(this,ht,e.gl,"f"),$(this,ut,r,"f"),$(this,xr,a,"f"),$(this,dt,new wr(e,t),"f"),$(this,j,{outputBufferW:1,outputBufferH:1,canvasBufferSize:[1,1],outputViewport:{x:0,y:0,w:1,h:1},elementBufferW:1,elementBufferH:1,contentRectUv:[0,0,1,1],srcRectUv:[0,0,1,1]},"f");let c={time:0,deltaTime:0,pixelRatio:r,resolution:[1,1],mouse:[0,0],mouseViewport:[0,0],intersection:0,enterTime:0,leaveTime:0,src:i,target:null,uniforms:{},vfxProps:n,dims:{element:[1,1],elementPixel:[1,1],canvas:[1,1],canvasPixel:[1,1],pixelRatio:r,contentRect:[0,0,1,1],srcRect:[0,0,1,1],canvasRect:[0,0,1,1]},quad:yr,gl:g(this,ht,"f"),createRenderTarget:l=>g(this,ye,"m",Ks).call(this,l),wrapTexture:(l,u)=>g(this,ye,"m",Qs).call(this,l,u),draw:l=>g(this,ye,"m",Zs).call(this,l),blit:(l,u,d)=>g(this,ye,"m",ei).call(this,l,u,d),onContextRestored:l=>{let u=g(this,ke,"f").onContextRestored(l);return g(this,kt,"f").push(u),u}};$(this,K,c,"f")}get ctx(){return g(this,K,"f")}setPhase(e){$(this,_e,e,"f")}setFrameDims(e){$(this,j,e,"f"),g(this,K,"f").resolution=[e.canvasBufferSize[0],e.canvasBufferSize[1]];for(let t of g(this,Ne,"f"))t.resolver.resize?.(e.outputBufferW,e.outputBufferH)}setEffectDims(e){g(this,K,"f").dims=e}setFrameState(e){let t=g(this,K,"f");t.time=e.time,t.deltaTime=e.deltaTime,t.mouse=e.mouse,t.mouseViewport=e.mouseViewport,t.intersection=e.intersection,t.enterTime=e.enterTime,t.leaveTime=e.leaveTime,t.uniforms=e.uniforms}setSrc(e){g(this,K,"f").src=e}setOutput(e){g(this,K,"f").target=e}passthroughCopy(e,t,r){let i=g(this,_e,"f");$(this,_e,"render","f");let n=g(this,K,"f").target;g(this,K,"f").target=t;try{let a=g(this,j,"f").outputViewport;g(this,j,"f").outputViewport={...r};let c=g(this,K,"f").vfxProps.glslVersion==="100"?oo:io;g(this,ye,"m",_r).call(this,{frag:c,uniforms:{src:e},target:t}),g(this,j,"f").outputViewport=a}finally{g(this,K,"f").target=n,$(this,_e,i,"f")}}clearRt(e){let t=g(this,ht,"f"),r=gs(e);t.bindFramebuffer(t.FRAMEBUFFER,r.getWriteFbo().fbo),t.viewport(0,0,e.width,e.height),t.clearColor(0,0,0,0),t.disable(t.SCISSOR_TEST),t.clear(t.COLOR_BUFFER_BIT),t.bindFramebuffer(t.FRAMEBUFFER,null)}tickAutoUpdates(){for(let e of g(this,Lt,"f"))e()}dispose(){$(this,_e,"disposed","f");for(let e of g(this,kt,"f"))e();$(this,kt,[],"f");for(let e of g(this,He,"f"))e.resolver.dispose?.();$(this,He,[],"f"),$(this,Ne,[],"f");for(let e of g(this,Bt,"f"))e.dispose();$(this,Bt,[],"f"),g(this,dt,"f").dispose(),$(this,Lt,[],"f")}};ke=new WeakMap,ht=new WeakMap,ut=new WeakMap,xr=new WeakMap,dt=new WeakMap,Bt=new WeakMap,He=new WeakMap,Ne=new WeakMap,kt=new WeakMap,_e=new WeakMap,lt=new WeakMap,j=new WeakMap,K=new WeakMap,Lt=new WeakMap,ye=new WeakSet,Ks=function(e){let t=e?.persistent??!1,r=e?.float??!1,i=Ys(e?.wrap),n=e?.filter,a=e?.mipmap??!1,f=a!==!1,c=a===!0,l=e?.size,u=l?l[0]:g(this,j,"f").outputBufferW,d=l?l[1]:g(this,j,"f").outputBufferH,h,p,v;if(t){let y=l?1:g(this,ut,"f"),E=l?u:u/y,_=l?d:d/y,S=new Fe(g(this,ke,"f"),E,_,y,r,{wrap:i,filter:n,mipmap:f});h={getReadTexture:()=>S.texture,getWriteFbo:()=>S.target,swap:()=>S.swap(),resize:l?void 0:(W,J)=>{S.resize(W/g(this,ut,"f"),J/g(this,ut,"f"))},dispose:()=>S.dispose()},f&&(h.regenerateMipmaps=()=>S.target.generateMipmaps(),h.mipmapAutoRegen=c),p=()=>S.target.width,v=()=>S.target.height}else{let y=new ve(g(this,ke,"f"),u,d,{float:r,wrap:i,filter:n,mipmap:f});h={getReadTexture:()=>y.texture,getWriteFbo:()=>y,resize:l?void 0:(E,_)=>y.setSize(E,_),dispose:()=>y.dispose()},f&&(h.regenerateMipmaps=()=>y.generateMipmaps(),h.mipmapAutoRegen=c),p=()=>y.width,v=()=>y.height}let w,M=si(h,p,v,()=>g(this,ye,"m",qs).call(this,w));return w={handle:M,resolver:h},g(this,He,"f").push(w),l||g(this,Ne,"f").push(w),M},qs=function(e){let t=g(this,He,"f").indexOf(e);if(t<0)return;g(this,He,"f").splice(t,1);let r=g(this,Ne,"f").indexOf(e);r>=0&&g(this,Ne,"f").splice(r,1),e.resolver.dispose?.()},Qs=function(e,t){let r=Ys(t?.wrap),i=t?.filter,n,a,f,c=null;if(fo(e)){if(!t?.size)throw new Error("[VFX-JS] wrapTexture(WebGLTexture) requires opts.size");let[u,d]=t.size;n=new U(g(this,ke,"f"),void 0,{autoRegister:!1,externalHandle:e}),a=()=>u,f=()=>d}else{let u=e;n=new U(g(this,ke,"f"),u);let d=t?.size,h=w=>{if(d)return w==="w"?d[0]:d[1];if(typeof HTMLImageElement<"u"&&u instanceof HTMLImageElement)return w==="w"?u.naturalWidth:u.naturalHeight;if(typeof HTMLVideoElement<"u"&&u instanceof HTMLVideoElement)return w==="w"?u.videoWidth:u.videoHeight;let F=u;return w==="w"?F.width:F.height};a=()=>h("w"),f=()=>h("h");let p=typeof HTMLVideoElement<"u"&&u instanceof HTMLVideoElement||typeof HTMLCanvasElement<"u"&&u instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&u instanceof OffscreenCanvas;(t?.autoUpdate??p)&&(c=()=>{n.needsUpdate=!0})}return n.wrapS=r[0],n.wrapT=r[1],i!==void 0&&(n.minFilter=i,n.magFilter=i),g(this,Bt,"f").push(n),c&&g(this,Lt,"f").push(c),pt(()=>n,a,f)},Zs=function(e){if(g(this,_e,"f")!=="render"){g(this,_e,"f")==="update"&&!g(this,lt,"f")&&($(this,lt,!0,"f"),console.warn("[VFX-JS] ctx.draw() called in update(); ignored. Move draws to render()."));return}g(this,ye,"m",_r).call(this,e)},ei=function(e,t,r){if(g(this,_e,"f")!=="render"){g(this,_e,"f")==="update"&&!g(this,lt,"f")&&($(this,lt,!0,"f"),console.warn("[VFX-JS] ctx.blit() called in update(); ignored. Move draws to render()."));return}let i=g(this,K,"f").vfxProps.glslVersion==="100"?ao:no;g(this,ye,"m",_r).call(this,{frag:i,uniforms:{src:e},target:t,blend:r?.blend,swap:r?.swap})},_r=function(e){let t=g(this,ht,"f"),r=e.vert??(g(this,K,"f").vfxProps.glslVersion==="100"?so:ro),i=g(this,xr,"f").get(r,e.frag,g(this,K,"f").vfxProps.glslVersion),n=g(this,K,"f").target,a=e.target===void 0||e.target===null?n:e.target,f=a===null||a===n,c,l,u,d,h,p,v;if(a===null)c=null,l=g(this,j,"f").outputViewport.x,u=g(this,j,"f").outputViewport.y,d=g(this,j,"f").outputViewport.w,h=g(this,j,"f").outputViewport.h;else{let y=gs(a);c=y.getWriteFbo().fbo,f?(l=g(this,j,"f").outputViewport.x,u=g(this,j,"f").outputViewport.y,d=g(this,j,"f").outputViewport.w,h=g(this,j,"f").outputViewport.h):(l=0,u=0,d=a.width,h=a.height),p=y.swap,y.mipmapAutoRegen&&(v=y.regenerateMipmaps)}t.bindFramebuffer(t.FRAMEBUFFER,c),t.viewport(l,u,d,h),t.disable(t.SCISSOR_TEST);let w=e.blend??(a===null?"premultiplied":"none");ps(t,w),i.use();let F=g(this,ye,"m",Js).call(this,e.uniforms);i.uploadUniforms(F);let M=e.geometry??yr;js(M)?g(this,dt,"f").quad.draw():g(this,dt,"f").resolve(M,i).draw(),v?.(),p&&e.swap!==!1&&p()},Js=function(e){let t={};if(t.contentRectUv={value:g(this,j,"f").contentRectUv},t.srcRectUv={value:g(this,j,"f").srcRectUv},!e)return t;for(let[r,i]of Object.entries(e))t[r]=co(i);return t};function fo(s){let e=globalThis.WebGLTexture;if(e&&typeof e=="function"&&s instanceof e)return!0;let t=s;return t.width===void 0&&t.naturalWidth===void 0&&t.videoWidth===void 0}function Ys(s){return s===void 0?["clamp","clamp"]:typeof s=="string"?[s,s]:[s[0],s[1]]}function co(s){return typeof s=="object"&&s!==null&&"__brand"in s?s.__brand==="EffectRenderTarget"?{value:gs(s).getReadTexture()}:{value:to(s)}:{value:s}}function pt(s,e,t){let r={__brand:"EffectTexture",get width(){return e()},get height(){return t()}};return Object.defineProperty(r,ti,{value:s}),r}function si(s,e,t,r){let i={__brand:"EffectRenderTarget",get width(){return e()},get height(){return t()},dispose:r??(()=>{}),generateMipmaps:()=>s.regenerateMipmaps?.()};return Object.defineProperty(i,ri,{value:s}),i}function Er(s){return si({getReadTexture:()=>s.texture,getWriteFbo:()=>s},()=>s.width,()=>s.height)}function ii(s){return typeof s=="number"?{top:s,right:s,bottom:s,left:s}:Array.isArray(s)?{top:s[0],right:s[1],bottom:s[2],left:s[3]}:{top:s.top??0,right:s.right??0,bottom:s.bottom??0,left:s.left??0}}function Ge(s){return ii(s)}var ws={top:0,right:0,bottom:0,left:0};function zt(s){return ii(s)}function Pr(s){return{top:s.top,right:s.right,bottom:s.bottom,left:s.left}}function Fr(s){return{top:s.top,left:s.left,right:s.left+Math.ceil(s.right-s.left),bottom:s.top+Math.ceil(s.bottom-s.top)}}function Sr(s,e){return{top:s.top-e.top,right:s.right+e.right,bottom:s.bottom+e.bottom,left:s.left-e.left}}function Tr(s,e,t){return Math.min(Math.max(s,e),t)}function oi(s,e){let[t,r,i,n]=s,[a,f,c,l]=e;return c<=0||l<=0?[0,0,1,1]:[(t-a)/c,(r-f)/l,i/c,n/l]}function ni(s,e){let t=Tr(e.left,s.left,s.right),i=(Tr(e.right,s.left,s.right)-t)/(e.right-e.left),n=Tr(e.top,s.top,s.bottom),f=(Tr(e.bottom,s.top,s.bottom)-n)/(e.bottom-e.top);return i*f}var L=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},m=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},G,Ot,Cr,Mr,Ar,Vr,re,Q,de,Se,pe,vt,$e,mt,Be,Ir,ue,Rr,Wt,xs,ci,ai,ys,li,fi,_s,hi,Xt=class{constructor(e,t,r,i,n,a,f,c){G.add(this),Ot.set(this,void 0),Cr.set(this,void 0),Mr.set(this,void 0),Ar.set(this,void 0),Vr.set(this,void 0),re.set(this,void 0),Q.set(this,void 0),de.set(this,void 0),Se.set(this,[]),pe.set(this,[]),vt.set(this,void 0),$e.set(this,new Set),mt.set(this,!1),Be.set(this,void 0),Ir.set(this,Ge(0)),ue.set(this,null),L(this,Ot,e,"f"),L(this,Cr,t,"f"),L(this,Mr,r,"f"),L(this,Ar,n,"f"),L(this,Vr,c,"f"),L(this,re,i,"f"),L(this,vt,a,"f"),L(this,Be,f,"f"),L(this,Q,i.map(()=>m(this,G,"m",Wt).call(this)),"f"),i.length===0&&L(this,ue,m(this,G,"m",Wt).call(this),"f"),L(this,de,m(this,G,"m",Rr).call(this),"f")}get effects(){return m(this,re,"f")}get hosts(){return m(this,Q,"f")}get renderingIndices(){return m(this,de,"f")}get stages(){return m(this,pe,"f")}get hitTestPadBuffer(){return m(this,Ir,"f")}async initAll(){for(let e=0;e<m(this,re,"f").length;e++){let t=m(this,re,"f")[e],r=m(this,Q,"f")[e];r.setPhase("init");try{t.init&&await t.init(r.ctx)}catch(i){console.error(`[VFX-JS] effect[${e}].init() failed:`,i);for(let n=e-1;n>=0;n--)m(this,G,"m",xs).call(this,n),m(this,Q,"f")[n].dispose();throw m(this,Q,"f")[e].dispose(),i}r.setPhase("update")}}run(e){if(m(this,mt,"f")||!e.isVisible)return;L(this,de,m(this,G,"m",Rr).call(this),"f");let t=m(this,de,"f").length;for(let r of m(this,Q,"f"))r.setFrameState({time:e.time,deltaTime:e.deltaTime,mouse:e.mouse,mouseViewport:e.mouseViewport,intersection:e.intersection,enterTime:e.enterTime,leaveTime:e.leaveTime,uniforms:e.resolvedUniforms});m(this,G,"m",ci).call(this,e);for(let r=0;r<m(this,Q,"f").length;r++)m(this,Q,"f")[r].setFrameDims(m(this,G,"m",hi).call(this,r,e)),m(this,Q,"f")[r].setEffectDims(m(this,G,"m",li).call(this,r,e));for(let r=0;r<m(this,re,"f").length;r++){let i=m(this,re,"f")[r];if(!i.update)continue;let n=m(this,Q,"f")[r];n.setPhase("update");try{i.update(n.ctx)}catch(a){let f=`${r}:update`;m(this,$e,"f").has(f)||(m(this,$e,"f").add(f),console.warn(`[VFX-JS] effect[${r}].update() threw; skipping this frame's update:`,a))}}if(t===0){(m(this,ue,"f")??m(this,Q,"f")[0]).passthroughCopy(m(this,vt,"f"),e.finalTarget,e.elementRectOnCanvasPx);return}for(let r=0;r<t;r++){let i=m(this,de,"f")[r],n=m(this,Q,"f")[i],a=m(this,re,"f")[i];if(!a.render)continue;n.setPhase("render"),n.tickAutoUpdates();let f=r===0?m(this,vt,"f"):m(this,Se,"f")[r-1].texHandle;n.setSrc(f);let c;r===t-1?c=e.finalTarget:(c=m(this,Se,"f")[r].rtHandle,n.clearRt(c)),n.setOutput(c);try{a.render(n.ctx)}catch(l){let u=`${i}:render`;m(this,$e,"f").has(u)||(m(this,$e,"f").add(u),console.warn(`[VFX-JS] effect[${i}].render() threw; falling back to passthrough:`,l));let d=m(this,pe,"f")[r].outputViewport;c===null?n.passthroughCopy(f,null,d):r===t-1?n.passthroughCopy(f,c,d):n.passthroughCopy(f,c,{x:0,y:0,w:c.width,h:c.height})}n.setPhase("update")}}dispose(){if(!m(this,mt,"f")){L(this,mt,!0,"f");for(let e=m(this,re,"f").length-1;e>=0;e--)m(this,G,"m",xs).call(this,e),m(this,Q,"f")[e].dispose();m(this,ue,"f")&&(m(this,ue,"f").dispose(),L(this,ue,null,"f"));for(let e of m(this,Se,"f"))e.fb.dispose();L(this,Se,[],"f"),L(this,pe,[],"f")}}async replaceEffects(e){if(m(this,mt,"f"))throw new Error("[VFX-JS] replaceEffects on disposed chain");let t=m(this,re,"f"),r=m(this,Q,"f"),i=new Map;for(let f=0;f<t.length;f++)i.set(t[f],r[f]);let n=new Array(e.length),a=[];for(let f=0;f<e.length;f++){let c=e[f],l=i.get(c);if(l)n[f]=l,i.delete(c);else{let u=m(this,G,"m",Wt).call(this);n[f]=u,a.push({host:u,effect:c})}}for(let f=0;f<a.length;f++){let{host:c,effect:l}=a[f];c.setPhase("init");try{l.init&&await l.init(c.ctx),c.setPhase("update")}catch(u){console.error("[VFX-JS] replaceEffects: new effect init() failed:",u);for(let d=f-1;d>=0;d--){let h=a[d];if(h.effect.dispose)try{h.effect.dispose()}catch(p){console.error("[VFX-JS] dispose during init rollback threw:",p)}h.host.dispose()}throw c.dispose(),u}}for(let[f,c]of i){if(f.dispose)try{f.dispose()}catch(l){console.error("[VFX-JS] effect.dispose() threw during replaceEffects:",l)}c.dispose()}for(let f of m(this,Se,"f"))f.fb.dispose();L(this,Se,[],"f"),L(this,pe,[],"f"),e.length===0&&!m(this,ue,"f")?L(this,ue,m(this,G,"m",Wt).call(this),"f"):e.length>0&&m(this,ue,"f")&&(m(this,ue,"f").dispose(),L(this,ue,null,"f")),L(this,re,e,"f"),L(this,Q,n,"f"),L(this,de,m(this,G,"m",Rr).call(this),"f"),m(this,$e,"f").clear()}};Ot=new WeakMap,Cr=new WeakMap,Mr=new WeakMap,Ar=new WeakMap,Vr=new WeakMap,re=new WeakMap,Q=new WeakMap,de=new WeakMap,Se=new WeakMap,pe=new WeakMap,vt=new WeakMap,$e=new WeakMap,mt=new WeakMap,Be=new WeakMap,Ir=new WeakMap,ue=new WeakMap,G=new WeakSet,Rr=function(){return m(this,re,"f").map((e,t)=>typeof e.render=="function"&&e.enabled!==!1?t:-1).filter(e=>e>=0)},Wt=function(){return new br(m(this,Ot,"f"),m(this,Cr,"f"),m(this,Mr,"f"),m(this,vt,"f"),m(this,Ar,"f"),m(this,Vr,"f"))},xs=function(e){let t=m(this,re,"f")[e];if(t.dispose)try{t.dispose()}catch(r){console.error(`[VFX-JS] effect[${e}].dispose() threw:`,r)}},ci=function(e){let t=m(this,de,"f").length;if(L(this,pe,new Array(t),"f"),t===0)return;let r=m(this,Be,"f")?e.canvasBufferSize:e.elementBufferSize,i=[0,0,r[0],r[1]],n=m(this,G,"m",_s).call(this,e),a=i;for(let d=0;d<t;d++){let h=m(this,de,"f")[d],p=m(this,re,"f")[h],v=d===t-1,F=m(this,G,"m",ai).call(this,p,a,i,n,e)??a,M=[F[2],F[3]],y=oi(i,F),E=v?{x:e.elementRectOnCanvasPx.x+F[0],y:e.elementRectOnCanvasPx.y+F[1],w:M[0],h:M[1]}:{x:0,y:0,w:M[0],h:M[1]};m(this,pe,"f")[d]={dstRect:F,dstBufferSize:M,contentRectUv:y,outputViewport:E},v||m(this,G,"m",fi).call(this,d,M),a=F}let[f,c,l,u]=m(this,pe,"f")[t-1].dstRect;L(this,Ir,Ge({top:Math.max(0,c+u-r[1]),right:Math.max(0,f+l-r[0]),bottom:Math.max(0,-c),left:Math.max(0,-f)}),"f")},ai=function(e,t,r,i,n){if(e.outputRect)return e.outputRect(m(this,G,"m",ys).call(this,n,r,t,i))},ys=function(e,t,r,i){let n=e.canvasBufferSize[0]/e.canvasSize[0]||1;return{element:m(this,Be,"f")?e.canvasSize:e.elementSize,elementPixel:m(this,Be,"f")?e.canvasBufferSize:e.elementBufferSize,canvas:e.canvasSize,canvasPixel:e.canvasBufferSize,pixelRatio:n,contentRect:t,srcRect:r,canvasRect:i}},li=function(e,t){let r=m(this,Be,"f")?t.canvasBufferSize:t.elementBufferSize,i=[0,0,r[0],r[1]],n=m(this,G,"m",_s).call(this,t),a=m(this,de,"f").indexOf(e),f=a<=0?i:m(this,pe,"f")[a-1].dstRect;return m(this,G,"m",ys).call(this,t,i,f,n)},fi=function(e,t){let r=m(this,Se,"f")[e];if(r&&r.fb.width===t[0]&&r.fb.height===t[1])return;r&&r.fb.dispose();let i=new ve(m(this,Ot,"f"),t[0],t[1]),n=Er(i),a=pt(()=>i.texture,()=>i.width,()=>i.height);m(this,Se,"f")[e]={fb:i,rtHandle:n,texHandle:a,bufferSize:t}},_s=function(e){let[t,r]=e.canvasBufferSize;if(m(this,Be,"f"))return[0,0,t,r];let{x:i,y:n}=e.elementRectOnCanvasPx;return[-i,-n,t,r]},hi=function(e,t){let r=m(this,de,"f").indexOf(e),i,n,a,f,c;if(r<0)i=t.elementBufferSize[0],n=t.elementBufferSize[1],a={x:0,y:0,w:i,h:n},f=[0,0,1,1],c=[0,0,1,1];else{let l=m(this,pe,"f")[r];i=l.dstBufferSize[0],n=l.dstBufferSize[1],a=l.outputViewport,f=l.contentRectUv,c=r===0?[0,0,1,1]:m(this,pe,"f")[r-1].contentRectUv}return{outputBufferW:i,outputBufferH:n,canvasBufferSize:t.canvasBufferSize,outputViewport:a,elementBufferW:t.elementBufferSize[0],elementBufferH:t.elementBufferSize[1],contentRectUv:f,srcRectUv:c}};function Le(s){this.data=s,this.pos=0}Le.prototype.readByte=function(){return this.data[this.pos++]};Le.prototype.peekByte=function(){return this.data[this.pos]};Le.prototype.readBytes=function(s){return this.data.subarray(this.pos,this.pos+=s)};Le.prototype.peekBytes=function(s){return this.data.subarray(this.pos,this.pos+s)};Le.prototype.readString=function(s){for(var e="",t=0;t<s;t++)e+=String.fromCharCode(this.readByte());return e};Le.prototype.readBitArray=function(){for(var s=[],e=this.readByte(),t=7;t>=0;t--)s.push(!!(e&1<<t));return s};Le.prototype.readUnsigned=function(s){var e=this.readBytes(2);return s?(e[1]<<8)+e[0]:(e[0]<<8)+e[1]};var ui=Le;function Dt(s){this.stream=new ui(s),this.output={}}Dt.prototype.parse=function(s){return this.parseParts(this.output,s),this.output};Dt.prototype.parseParts=function(s,e){for(var t=0;t<e.length;t++){var r=e[t];this.parsePart(s,r)}};Dt.prototype.parsePart=function(s,e){var t=e.label,r;if(!(e.requires&&!e.requires(this.stream,this.output,s)))if(e.loop){for(var i=[];e.loop(this.stream);){var n={};this.parseParts(n,e.parts),i.push(n)}s[t]=i}else e.parts?(r={},this.parseParts(r,e.parts),s[t]=r):e.parser?(r=e.parser(this.stream,this.output,s),e.skip||(s[t]=r)):e.bits&&(s[t]=this.parseBits(e.bits))};function lo(s){return s.reduce(function(e,t){return e*2+t},0)}Dt.prototype.parseBits=function(s){var e={},t=this.stream.readBitArray();for(var r in s){var i=s[r];i.length?e[r]=lo(t.slice(i.index,i.index+i.length)):e[r]=t[i.index]}return e};var di=Dt;var ho={readByte:function(){return function(s){return s.readByte()}},readBytes:function(s){return function(e){return e.readBytes(s)}},readString:function(s){return function(e){return e.readString(s)}},readUnsigned:function(s){return function(e){return e.readUnsigned(s)}},readArray:function(s,e){return function(t,r,i){for(var n=e(t,r,i),a=new Array(n),f=0;f<n;f++)a[f]=t.readBytes(s);return a}}},z=ho;var Ur={label:"blocks",parser:function(s){for(var e=[],t=0,r=0,i=s.readByte();i!==r;i=s.readByte())e.push(s.readBytes(i)),t+=i;var n=new Uint8Array(t);t=0;for(var a=0;a<e.length;a++)n.set(e[a],t),t+=e[a].length;return n}},uo={label:"gce",requires:function(s){var e=s.peekBytes(2);return e[0]===33&&e[1]===249},parts:[{label:"codes",parser:z.readBytes(2),skip:!0},{label:"byteSize",parser:z.readByte()},{label:"extras",bits:{future:{index:0,length:3},disposal:{index:3,length:3},userInput:{index:6},transparentColorGiven:{index:7}}},{label:"delay",parser:z.readUnsigned(!0)},{label:"transparentColorIndex",parser:z.readByte()},{label:"terminator",parser:z.readByte(),skip:!0}]},po={label:"image",requires:function(s){var e=s.peekByte();return e===44},parts:[{label:"code",parser:z.readByte(),skip:!0},{label:"descriptor",parts:[{label:"left",parser:z.readUnsigned(!0)},{label:"top",parser:z.readUnsigned(!0)},{label:"width",parser:z.readUnsigned(!0)},{label:"height",parser:z.readUnsigned(!0)},{label:"lct",bits:{exists:{index:0},interlaced:{index:1},sort:{index:2},future:{index:3,length:2},size:{index:5,length:3}}}]},{label:"lct",requires:function(s,e,t){return t.descriptor.lct.exists},parser:z.readArray(3,function(s,e,t){return Math.pow(2,t.descriptor.lct.size+1)})},{label:"data",parts:[{label:"minCodeSize",parser:z.readByte()},Ur]}]},mo={label:"text",requires:function(s){var e=s.peekBytes(2);return e[0]===33&&e[1]===1},parts:[{label:"codes",parser:z.readBytes(2),skip:!0},{label:"blockSize",parser:z.readByte()},{label:"preData",parser:function(s,e,t){return s.readBytes(t.text.blockSize)}},Ur]},vo={label:"application",requires:function(s,e,t){var r=s.peekBytes(2);return r[0]===33&&r[1]===255},parts:[{label:"codes",parser:z.readBytes(2),skip:!0},{label:"blockSize",parser:z.readByte()},{label:"id",parser:function(s,e,t){return s.readString(t.blockSize)}},Ur]},go={label:"comment",requires:function(s,e,t){var r=s.peekBytes(2);return r[0]===33&&r[1]===254},parts:[{label:"codes",parser:z.readBytes(2),skip:!0},Ur]},wo={label:"frames",parts:[uo,vo,go,po,mo],loop:function(s){var e=s.peekByte();return e===33||e===44}},yo=[{label:"header",parts:[{label:"signature",parser:z.readString(3)},{label:"version",parser:z.readString(3)}]},{label:"lsd",parts:[{label:"width",parser:z.readUnsigned(!0)},{label:"height",parser:z.readUnsigned(!0)},{label:"gct",bits:{exists:{index:0},resolution:{index:1,length:3},sort:{index:4},size:{index:5,length:3}}},{label:"backgroundColorIndex",parser:z.readByte()},{label:"pixelAspectRatio",parser:z.readByte()}]},{label:"gct",requires:function(s,e){return e.lsd.gct.exists},parser:z.readArray(3,function(s,e){return Math.pow(2,e.lsd.gct.size+1)})},wo],pi=yo;function bs(s){var e=new Uint8Array(s),t=new di(e);this.raw=t.parse(pi),this.raw.hasImages=!1;for(var r=0;r<this.raw.frames.length;r++)if(this.raw.frames[r].image){this.raw.hasImages=!0;break}}bs.prototype.decompressFrame=function(s,e){if(s>=this.raw.frames.length)return null;var t=this.raw.frames[s];if(t.image){var r=t.image.descriptor.width*t.image.descriptor.height,i=a(t.image.data.minCodeSize,t.image.data.blocks,r);t.image.descriptor.lct.interlaced&&(i=f(i,t.image.descriptor.width));var n={pixels:i,dims:{top:t.image.descriptor.top,left:t.image.descriptor.left,width:t.image.descriptor.width,height:t.image.descriptor.height}};return t.image.descriptor.lct&&t.image.descriptor.lct.exists?n.colorTable=t.image.lct:n.colorTable=this.raw.gct,t.gce&&(n.delay=(t.gce.delay||10)*10,n.disposalType=t.gce.extras.disposal,t.gce.extras.transparentColorGiven&&(n.transparentIndex=t.gce.transparentColorIndex)),e&&(n.patch=c(n)),n}return null;function a(l,u,d){var h=4096,p=-1,v=d,w,F,M,y,E,_,S,W,J,A,T,x,I,H,Y,Ve,Xe,ee=new Array(d),ie=new Array(h),Et=new Array(h),Tt=new Array(h+1);for(I=l,F=1<<I,_=F+1,w=F+2,W=p,y=I+1,M=(1<<y)-1,A=0;A<F;A++)ie[A]=0,Et[A]=A;for(x=J=E=H=Y=Xe=Ve=0,T=0;T<v;){if(Y===0){if(J<y){x+=u[Ve]<<J,J+=8,Ve++;continue}if(A=x&M,x>>=y,J-=y,A>w||A==_)break;if(A==F){y=I+1,M=(1<<y)-1,w=F+2,W=p;continue}if(W==p){Tt[Y++]=Et[A],W=A,H=A;continue}for(S=A,A==w&&(Tt[Y++]=H,A=W);A>F;)Tt[Y++]=Et[A],A=ie[A];H=Et[A]&255,Tt[Y++]=H,w<h&&(ie[w]=W,Et[w]=H,w++,(w&M)===0&&w<h&&(y++,M+=w)),W=S}Y--,ee[Xe++]=Tt[Y],T++}for(T=Xe;T<v;T++)ee[T]=0;return ee}function f(l,u){for(var d=new Array(l.length),h=l.length/u,p=function(E,_){var S=l.slice(_*u,(_+1)*u);d.splice.apply(d,[E*u,u].concat(S))},v=[0,4,2,1],w=[8,8,4,2],F=0,M=0;M<4;M++)for(var y=v[M];y<h;y+=w[M])p(y,F),F++;return d}function c(l){for(var u=l.pixels.length,d=new Uint8ClampedArray(u*4),h=0;h<u;h++){var p=h*4,v=l.pixels[h],w=l.colorTable[v];d[p]=w[0],d[p+1]=w[1],d[p+2]=w[2],d[p+3]=v!==l.transparentIndex?255:0}return d}};bs.prototype.decompressFrames=function(s,e,t){e===void 0&&(e=0),t===void 0?t=this.raw.frames.length:t=Math.min(t,this.raw.frames.length);for(var r=[],i=e;i<t;i++){var n=this.raw.frames[i];n.image&&r.push(this.decompressFrame(i,s))}return r};var mi=bs;var vi=mi;var gt=class s{static async create(e,t){let r=await fetch(e).then(f=>f.arrayBuffer()).then(f=>new vi(f)),i=r.decompressFrames(!0,void 0,void 0),{width:n,height:a}=r.raw.lsd;return new s(i,n,a,t)}constructor(e,t,r,i){this.frames=[],this.index=0,this.playTime=0,this.frames=e,this.canvas=document.createElement("canvas"),this.ctx=this.canvas.getContext("2d"),this.pixelRatio=i,this.canvas.width=t,this.canvas.height=r,this.startTime=Date.now()}getCanvas(){return this.canvas}update(){let t=Date.now()-this.startTime;for(;this.playTime<t;){let n=this.frames[this.index%this.frames.length];this.playTime+=n.delay,this.index++}let r=this.frames[this.index%this.frames.length],i=new ImageData(r.patch,r.dims.width,r.dims.height);this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height),this.ctx.putImageData(i,r.dims.left,r.dims.top)}};var xe=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},Ht,Nt,Gt,Es,Ts,kr=class{constructor(e){this.isContextLost=!1,Ht.set(this,new Set),Nt.set(this,new Set),Gt.set(this,new Set),Es.set(this,r=>{r.preventDefault(),this.isContextLost=!0;for(let i of xe(this,Nt,"f"))i()}),Ts.set(this,()=>{this.isContextLost=!1;let r=this.gl;r.getExtension("EXT_color_buffer_float"),r.getExtension("EXT_color_buffer_half_float");for(let i of xe(this,Ht,"f"))i.restore();for(let i of xe(this,Gt,"f"))i()});let t=e.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1});if(!t)throw new Error("[VFX-JS] WebGL2 is not available.");this.gl=t,this.canvas=e,t.getExtension("EXT_color_buffer_float"),t.getExtension("EXT_color_buffer_half_float"),this.floatLinearFilter=!!t.getExtension("OES_texture_float_linear"),this.maxTextureSize=t.getParameter(t.MAX_TEXTURE_SIZE),e.addEventListener("webglcontextlost",xe(this,Es,"f"),!1),e.addEventListener("webglcontextrestored",xe(this,Ts,"f"),!1)}setSize(e,t,r){let i=Math.floor(e*r),n=Math.floor(t*r);(this.canvas.width!==i||this.canvas.height!==n)&&(this.canvas.width=i,this.canvas.height=n)}addResource(e){xe(this,Ht,"f").add(e)}removeResource(e){xe(this,Ht,"f").delete(e)}onContextLost(e){return xe(this,Nt,"f").add(e),()=>xe(this,Nt,"f").delete(e)}onContextRestored(e){return xe(this,Gt,"f").add(e),()=>xe(this,Gt,"f").delete(e)}};Ht=new WeakMap,Nt=new WeakMap,Gt=new WeakMap,Es=new WeakMap,Ts=new WeakMap;var gi=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},Br=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},Lr,zr,Wr,Ps,Or=class{constructor(e){Lr.add(this),zr.set(this,void 0),Wr.set(this,void 0),gi(this,zr,e,"f"),this.gl=e.gl,Br(this,Lr,"m",Ps).call(this),e.addResource(this)}restore(){Br(this,Lr,"m",Ps).call(this)}draw(){let e=this.gl;e.bindVertexArray(this.vao),e.drawArrays(e.TRIANGLES,0,6)}dispose(){Br(this,zr,"f").removeResource(this),this.gl.deleteVertexArray(this.vao),this.gl.deleteBuffer(Br(this,Wr,"f"))}};zr=new WeakMap,Wr=new WeakMap,Lr=new WeakSet,Ps=function(){let e=this.gl,t=e.createVertexArray(),r=e.createBuffer();if(!t||!r)throw new Error("[VFX-JS] Failed to create quad VAO");this.vao=t,gi(this,Wr,r,"f");let i=new Float32Array([-1,-1,0,1,-1,0,-1,1,0,-1,1,0,1,-1,0,1,1,0]);e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,i,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0),e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null)};function Xr(s,e,t,r={}){return new ve(s,e,t,{float:r.float??!1})}function Dr(s,e){let t=e.renderingToBuffer??!1,r;t?r="none":e.premultipliedAlpha?r="premultiplied":r="normal";let i=e.glslVersion??ds(e.fragmentShader),n=e.vertexShader??(i==="100"?As:tr);return new at(s,n,e.fragmentShader,e.uniforms,r,i)}var je=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},V=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},q,$t,Me,jt,wt,ze,qt=class{constructor(e,t,r,i,n,a,f,c){if(q.set(this,void 0),$t.set(this,void 0),Me.set(this,void 0),jt.set(this,void 0),wt.set(this,void 0),ze.set(this,void 0),je(this,jt,i??!1,"f"),je(this,wt,n??!1,"f"),je(this,ze,a,"f"),je(this,$t,{},"f"),je(this,q,{src:{value:null},offset:{value:new te},resolution:{value:new te},viewport:{value:new ge},time:{value:0},mouse:{value:new te},passIndex:{value:0}},"f"),r)for(let[l,u]of Object.entries(r))typeof u=="function"?(V(this,$t,"f")[l]=u,V(this,q,"f")[l]={value:u()}):V(this,q,"f")[l]={value:u};this.pass=Dr(e,{fragmentShader:t,uniforms:V(this,q,"f"),renderingToBuffer:f??!1,premultipliedAlpha:!0,glslVersion:c})}get uniforms(){return V(this,q,"f")}setUniforms(e,t,r,i,n,a){V(this,q,"f").src.value=e,V(this,q,"f").resolution.value.set(r.w*t,r.h*t),V(this,q,"f").offset.value.set(r.x*t,r.y*t),V(this,q,"f").time.value=i,V(this,q,"f").mouse.value.set(n*t,a*t)}updateCustomUniforms(e){for(let[t,r]of Object.entries(V(this,$t,"f")))V(this,q,"f")[t]&&(V(this,q,"f")[t].value=r());if(e)for(let[t,r]of Object.entries(e))V(this,q,"f")[t]&&(V(this,q,"f")[t].value=r())}initializeBackbuffer(e,t,r,i){V(this,jt,"f")&&!V(this,Me,"f")&&(V(this,ze,"f")?je(this,Me,new Fe(e,V(this,ze,"f")[0],V(this,ze,"f")[1],1,V(this,wt,"f")),"f"):je(this,Me,new Fe(e,t,r,i,V(this,wt,"f")),"f"))}resizeBackbuffer(e,t){V(this,Me,"f")&&!V(this,ze,"f")&&V(this,Me,"f").resize(e,t)}registerBufferUniform(e){V(this,q,"f")[e]||(V(this,q,"f")[e]={value:null})}get backbuffer(){return V(this,Me,"f")}get persistent(){return V(this,jt,"f")}get float(){return V(this,wt,"f")}get size(){return V(this,ze,"f")}dispose(){this.pass.dispose(),V(this,Me,"f")?.dispose()}};q=new WeakMap,$t=new WeakMap,Me=new WeakMap,jt=new WeakMap,wt=new WeakMap,ze=new WeakMap;var _o=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},yt=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},Hr,qe,Nr=class{constructor(e){Hr.set(this,void 0),qe.set(this,new Map),_o(this,Hr,e,"f")}get(e,t,r){let i=`${t}\0${e}\0${r??""}`,n=yt(this,qe,"f").get(i);return n||(n=new nt(yt(this,Hr,"f"),e,t,r),yt(this,qe,"f").set(i,n)),n}get size(){return yt(this,qe,"f").size}dispose(){for(let e of yt(this,qe,"f").values())e.dispose();yt(this,qe,"f").clear()}};Hr=new WeakMap,qe=new WeakMap;var k=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},o=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},P,Re,Ae,R,Ye,Ke,xt,fe,ae,D,_t,ne,Qe,Oe,Jt,Gr,Yt,We,b,Z,Kt,se,Qt,Je,be,Ee,Te,Pe,Zt,bi,er,$r,jr,Ei,Ti,qr,Pi,Cs,Fs,Jr,wi,Kr,Ss,ce,Yr,Fi,yi,Si,Ri,Ci,Qr=new Map,Zr=class{constructor(e,t){P.add(this),Re.set(this,void 0),Ae.set(this,void 0),R.set(this,void 0),Ye.set(this,void 0),Ke.set(this,void 0),xt.set(this,void 0),fe.set(this,void 0),ae.set(this,[]),D.set(this,void 0),_t.set(this,new Map),ne.set(this,null),Qe.set(this,!1),Oe.set(this,new WeakSet),Jt.set(this,{}),Gr.set(this,{}),Yt.set(this,0),We.set(this,void 0),b.set(this,2),Z.set(this,[]),Kt.set(this,Date.now()/1e3),se.set(this,zt(0)),Qt.set(this,zt(0)),Je.set(this,[0,0]),be.set(this,0),Ee.set(this,0),Te.set(this,0),Pe.set(this,0),Zt.set(this,new WeakMap),er.set(this,async()=>{if(typeof window<"u"){for(let r of o(this,Z,"f"))if(r.type==="text"&&r.isInViewport){let i=r.element.getBoundingClientRect(),n=Math.ceil(i.width),a=Math.ceil(i.height);(n!==r.width||a!==r.height)&&(await o(this,P,"m",jr).call(this,r),r.width=n,r.height=a)}for(let r of o(this,Z,"f"))if(r.type==="text"&&!r.isInViewport){let i=r.element.getBoundingClientRect(),n=Math.ceil(i.width),a=Math.ceil(i.height);(n!==r.width||a!==r.height)&&(await o(this,P,"m",jr).call(this,r),r.width=n,r.height=a)}}}),$r.set(this,r=>{typeof window<"u"&&(k(this,Te,r.clientX,"f"),k(this,Pe,window.innerHeight-r.clientY,"f"))}),qr.set(this,()=>{this.isPlaying()&&(this.render(),k(this,We,requestAnimationFrame(o(this,qr,"f")),"f"))}),k(this,Re,e,"f"),k(this,Ae,t,"f"),k(this,R,new kr(t),"f"),k(this,Ye,o(this,R,"f").gl,"f"),o(this,Ye,"f").clearColor(0,0,0,0),k(this,b,e.pixelRatio,"f"),k(this,Ke,new Or(o(this,R,"f")),"f"),k(this,xt,new Nr(o(this,R,"f")),"f"),typeof window<"u"&&(window.addEventListener("resize",o(this,er,"f")),window.addEventListener("pointermove",o(this,$r,"f"))),o(this,er,"f").call(this),k(this,fe,new hr(o(this,R,"f")),"f"),o(this,P,"m",Fi).call(this,e.postEffects),o(this,R,"f").onContextRestored(()=>{o(this,Ye,"f").clearColor(0,0,0,0)})}destroy(){this.stop(),typeof window<"u"&&(window.removeEventListener("resize",o(this,er,"f")),window.removeEventListener("pointermove",o(this,$r,"f"))),o(this,D,"f")?.dispose();for(let e of o(this,_t,"f").values())e?.dispose();for(let e of o(this,ae,"f"))e.pass.dispose();o(this,ne,"f")&&(o(this,ne,"f").dispose(),k(this,ne,null,"f"),k(this,Qe,!1,"f")),o(this,fe,"f").dispose(),o(this,xt,"f").dispose(),o(this,Ke,"f").dispose()}async addElement(e,t={},r){if(t.effect!==void 0)return o(this,P,"m",Ei).call(this,e,t,t.effect,r);let i=o(this,P,"m",Ti).call(this,t),n=e.getBoundingClientRect(),a=Ui(e)?Fr(n):Pr(n),[f,c]=Ai(t.overflow),l=Sr(a,c),u=Vi(t.intersection),d=e.style.opacity===""?1:Number.parseFloat(e.style.opacity),h,p,v=!1;if(e instanceof HTMLImageElement)if(p="img",v=!!e.src.match(/\.gif/i),v){let x=await gt.create(e.src,o(this,b,"f"));Qr.set(e,x),h=new U(o(this,R,"f"),x.getCanvas())}else{let x=await sr(e.src);h=new U(o(this,R,"f"),x)}else if(e instanceof HTMLVideoElement)h=new U(o(this,R,"f"),e),p="video";else if(e instanceof HTMLCanvasElement)e.hasAttribute("layoutsubtree")&&r?(h=new U(o(this,R,"f"),r),p="hic"):(h=new U(o(this,R,"f"),e),p="canvas");else{let x=await Vt(e,d,void 0,this.maxTextureSize);h=new U(o(this,R,"f"),x),p="text"}let[w,F]=Ii(t.wrap);h.wrapS=w,h.wrapT=F,h.needsUpdate=!0;let M=t.autoCrop??!0;if(p!=="hic"){if(t.overlay!==!0)if(typeof t.overlay=="number")e.style.setProperty("opacity",t.overlay.toString());else{let x=p==="video"?"0.0001":"0";e.style.setProperty("opacity",x.toString())}}let y={src:{value:h},resolution:{value:new te},offset:{value:new te},time:{value:0},enterTime:{value:-1},leaveTime:{value:-1},mouse:{value:new te},intersection:{value:0},viewport:{value:new ge},autoCrop:{value:M}},E={};if(t.uniforms!==void 0)for(let[x,I]of Object.entries(t.uniforms))typeof I=="function"?(y[x]={value:I()},E[x]=I):y[x]={value:I};let _;t.backbuffer&&(_=(()=>{let x=(l.right-l.left)*o(this,b,"f"),I=(l.bottom-l.top)*o(this,b,"f");return new Fe(o(this,R,"f"),x,I,o(this,b,"f"),!1)})(),y.backbuffer={value:_.texture});let S=new Map,W=new Map;for(let x=0;x<i.length-1;x++){let I=i[x].target??`pass${x}`;i[x]={...i[x],target:I};let H=i[x].size,Y=H?H[0]:(l.right-l.left)*o(this,b,"f"),Ve=H?H[1]:(l.bottom-l.top)*o(this,b,"f");if(i[x].persistent){let Xe=H?1:o(this,b,"f"),ee=H?H[0]:l.right-l.left,ie=H?H[1]:l.bottom-l.top;W.set(I,new Fe(o(this,R,"f"),ee,ie,Xe,i[x].float))}else S.set(I,Xr(o(this,R,"f"),Y,Ve,{float:i[x].float}))}let J=[];for(let x=0;x<i.length;x++){let I=i[x],H=I.frag,Y={...y},Ve={};for(let[ee,ie]of S)ee!==I.target&&H.match(new RegExp(`uniform\\s+sampler2D\\s+${ee}\\b`))&&(Y[ee]={value:ie.texture});for(let[ee,ie]of W)H.match(new RegExp(`uniform\\s+sampler2D\\s+${ee}\\b`))&&(Y[ee]={value:ie.texture});if(I.uniforms)for(let[ee,ie]of Object.entries(I.uniforms))typeof ie=="function"?(Y[ee]={value:ie()},Ve[ee]=ie):Y[ee]={value:ie};let Xe=Dr(o(this,R,"f"),{vertexShader:I.vert,fragmentShader:H,uniforms:Y,renderingToBuffer:I.target!==void 0,glslVersion:I.glslVersion});J.push({pass:Xe,uniforms:Y,uniformGenerators:{...E,...Ve},target:I.target,persistent:I.persistent,float:I.float,size:I.size,backbuffer:I.target?W.get(I.target):void 0})}let A=Date.now()/1e3,T={type:p,element:e,isInViewport:!1,isInLogicalViewport:!1,width:a.right-a.left,height:a.bottom-a.top,passes:J,bufferTargets:S,startTime:A,enterTime:A,leaveTime:Number.NEGATIVE_INFINITY,release:t.release??Number.POSITIVE_INFINITY,isGif:v,isFullScreen:f,overflow:c,intersection:u,originalOpacity:d,srcTexture:h,zIndex:t.zIndex??0,backbuffer:_,autoCrop:M};o(this,P,"m",Kr).call(this,T,a,A),o(this,Z,"f").push(T),o(this,Z,"f").sort((x,I)=>x.zIndex-I.zIndex)}async updateElementEffects(e,t){let r=o(this,Z,"f").find(l=>l.element===e);if(!r)throw new Error("[VFX-JS] updateElementEffects: element not registered");if(!r.chain)throw new Error("[VFX-JS] updateElementEffects: element is on the shader path; effect-only updates are not supported");let i=Array.isArray(t)?[...t]:[t],n=r.chain.effects,a=new Set(n),f=[];for(let l of i)if(!a.has(l)){if(o(this,Oe,"f").has(l))throw new Error("[VFX-JS] Effect instance already attached. Construct a new instance per `vfx.add()` / `postEffect`.");f.push(l)}await r.chain.replaceEffects(i);let c=new Set(i);for(let l of n)c.has(l)||o(this,Oe,"f").delete(l);for(let l of f)o(this,Oe,"f").add(l)}removeElement(e){let t=o(this,Z,"f").findIndex(r=>r.element===e);if(t!==-1){let r=o(this,Z,"f").splice(t,1)[0];if(r.chain)o(this,P,"m",Jr).call(this,r.chain.effects),r.chain.dispose();else{for(let i of r.bufferTargets.values())i.dispose();for(let i of r.passes)i.pass.dispose(),i.backbuffer?.dispose();r.backbuffer?.dispose()}r.srcTexture.dispose(),e.style.setProperty("opacity",r.originalOpacity.toString())}}updateTextElement(e){let t=o(this,Z,"f").findIndex(r=>r.element===e);return t!==-1?o(this,P,"m",jr).call(this,o(this,Z,"f")[t]):Promise.resolve()}async updateImageElement(e){let t=o(this,Z,"f").find(a=>a.element===e);if(!t||t.type!=="img"||t.isGif)return;let r=await sr(e.src),i=t.srcTexture,n=new U(o(this,R,"f"),r);n.wrapS=i.wrapS,n.wrapT=i.wrapT,n.needsUpdate=!0,!t.chain&&t.passes.length>0&&(t.passes[0].uniforms.src.value=n),t.srcTexture=n,i.dispose()}updateCanvasElement(e){let t=o(this,Z,"f").find(r=>r.element===e);if(t){let r=t.srcTexture,i=new U(o(this,R,"f"),e);i.wrapS=r.wrapS,i.wrapT=r.wrapT,i.needsUpdate=!0,!t.chain&&t.passes.length>0&&(t.passes[0].uniforms.src.value=i),t.srcTexture=i,r.dispose()}}updateHICTexture(e,t){let r=o(this,Z,"f").find(n=>n.element===e);if(!r||r.type!=="hic")return;let i=r.srcTexture;if(i.source===t)i.needsUpdate=!0;else{let n=new U(o(this,R,"f"),t);n.wrapS=i.wrapS,n.wrapT=i.wrapT,n.needsUpdate=!0,!r.chain&&r.passes.length>0&&(r.passes[0].uniforms.src.value=n),r.srcTexture=n,i.dispose()}}get maxTextureSize(){return o(this,R,"f").maxTextureSize}isPlaying(){return o(this,We,"f")!==void 0}play(){this.isPlaying()||k(this,We,requestAnimationFrame(o(this,qr,"f")),"f")}stop(){o(this,We,"f")!==void 0&&(cancelAnimationFrame(o(this,We,"f")),k(this,We,void 0,"f"))}render(){let e=Date.now()/1e3,t=o(this,Ye,"f");o(this,P,"m",bi).call(this),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,o(this,Ae,"f").width,o(this,Ae,"f").height),t.clear(t.COLOR_BUFFER_BIT);let r=o(this,se,"f").right-o(this,se,"f").left,i=o(this,se,"f").bottom-o(this,se,"f").top,n=Ie(0,0,r,i),a=o(this,P,"m",Cs).call(this);a&&(o(this,P,"m",Ci).call(this,r,i),o(this,D,"f")&&(t.bindFramebuffer(t.FRAMEBUFFER,o(this,D,"f").fbo),t.clear(t.COLOR_BUFFER_BIT),t.bindFramebuffer(t.FRAMEBUFFER,null)));for(let f of o(this,Z,"f")){let c=f.element.getBoundingClientRect(),l=f.type==="text"?Fr(c):Pr(c),u=o(this,P,"m",Kr).call(this,f,l,e);if(!u.isVisible)continue;if(f.chain){o(this,P,"m",Pi).call(this,f,l,u,e);continue}let d=f.passes[0].uniforms;d.time.value=e-f.startTime,d.resolution.value.set((l.right-l.left)*o(this,b,"f"),(l.bottom-l.top)*o(this,b,"f")),d.mouse.value.set((o(this,Te,"f")+o(this,be,"f"))*o(this,b,"f"),(o(this,Pe,"f")+o(this,Ee,"f"))*o(this,b,"f"));for(let E of f.passes)for(let[_,S]of Object.entries(E.uniformGenerators))E.uniforms[_].value=S();Qr.get(f.element)?.update(),(f.type==="video"||f.isGif)&&(d.src.value.needsUpdate=!0);let h=or(l,i,o(this,be,"f"),o(this,Ee,"f")),p=or(u.rectWithOverflow,i,o(this,be,"f"),o(this,Ee,"f"));f.backbuffer&&(f.passes[0].uniforms.backbuffer.value=f.backbuffer.texture);{let E=f.isFullScreen?n:p,_=Math.max(1,E.w*o(this,b,"f")),S=Math.max(1,E.h*o(this,b,"f")),W=Math.max(1,E.w),J=Math.max(1,E.h);for(let A=0;A<f.passes.length-1;A++){let T=f.passes[A];if(!T.size)if(T.backbuffer)T.backbuffer.resize(W,J);else{let x=f.bufferTargets.get(T.target);x&&(x.width!==_||x.height!==S)&&x.setSize(_,S)}}}let v=new Map;for(let E of f.passes)E.backbuffer&&E.target&&v.set(E.target,E.backbuffer.texture);let w=f.srcTexture,F=o(this,Te,"f")+o(this,be,"f")-h.x,M=o(this,Pe,"f")+o(this,Ee,"f")-h.y;for(let E=0;E<f.passes.length-1;E++){let _=f.passes[E],S=f.isFullScreen?n:p;_.uniforms.src.value=w;for(let[T,x]of v)_.uniforms[T]&&(_.uniforms[T].value=x);for(let[T,x]of Object.entries(_.uniformGenerators))_.uniforms[T]&&(_.uniforms[T].value=x());let W=_.size?_.size[0]:S.w*o(this,b,"f"),J=_.size?_.size[1]:S.h*o(this,b,"f"),A=_.size?Ie(0,0,_.size[0],_.size[1]):Ie(0,0,S.w,S.h);if(_.uniforms.resolution.value.set(W,J),_.uniforms.offset.value.set(0,0),_.uniforms.mouse.value.set(F/S.w*W,M/S.h*J),_.backbuffer)o(this,P,"m",ce).call(this,_.pass,_.backbuffer.target,A,_.uniforms,!0),_.backbuffer.swap(),w=_.backbuffer.texture;else{let T=f.bufferTargets.get(_.target);if(!T)continue;o(this,P,"m",ce).call(this,_.pass,T,A,_.uniforms,!0),w=T.texture}_.target&&v.set(_.target,w)}let y=f.passes[f.passes.length-1];y.uniforms.src.value=w,y.uniforms.resolution.value.set(c.width*o(this,b,"f"),c.height*o(this,b,"f")),y.uniforms.offset.value.set(h.x*o(this,b,"f"),h.y*o(this,b,"f")),y.uniforms.mouse.value.set((o(this,Te,"f")+o(this,be,"f"))*o(this,b,"f"),(o(this,Pe,"f")+o(this,Ee,"f"))*o(this,b,"f"));for(let[E,_]of v)y.uniforms[E]&&(y.uniforms[E].value=_);for(let[E,_]of Object.entries(y.uniformGenerators))y.uniforms[E]&&(y.uniforms[E].value=_());f.backbuffer?(y.uniforms.backbuffer.value=f.backbuffer.texture,f.isFullScreen?(f.backbuffer.resize(r,i),o(this,P,"m",Yr).call(this,f,h.x,h.y),o(this,P,"m",ce).call(this,y.pass,f.backbuffer.target,n,y.uniforms,!0),f.backbuffer.swap(),o(this,fe,"f").setUniforms(f.backbuffer.texture,o(this,b,"f"),n),o(this,P,"m",ce).call(this,o(this,fe,"f").pass,a&&o(this,D,"f")||null,n,o(this,fe,"f").uniforms,!1)):(f.backbuffer.resize(p.w,p.h),o(this,P,"m",Yr).call(this,f,f.overflow.left,f.overflow.bottom),o(this,P,"m",ce).call(this,y.pass,f.backbuffer.target,f.backbuffer.getViewport(),y.uniforms,!0),f.backbuffer.swap(),o(this,fe,"f").setUniforms(f.backbuffer.texture,o(this,b,"f"),p),o(this,P,"m",ce).call(this,o(this,fe,"f").pass,a&&o(this,D,"f")||null,p,o(this,fe,"f").uniforms,!1))):(o(this,P,"m",Yr).call(this,f,h.x,h.y),o(this,P,"m",ce).call(this,y.pass,a&&o(this,D,"f")||null,f.isFullScreen?n:p,y.uniforms,!1))}a&&o(this,D,"f")&&(o(this,ne,"f")&&o(this,Qe,"f")?o(this,P,"m",Si).call(this,n,e):o(this,P,"m",Ri).call(this,n,e))}};Re=new WeakMap,Ae=new WeakMap,R=new WeakMap,Ye=new WeakMap,Ke=new WeakMap,xt=new WeakMap,fe=new WeakMap,ae=new WeakMap,D=new WeakMap,_t=new WeakMap,ne=new WeakMap,Qe=new WeakMap,Oe=new WeakMap,Jt=new WeakMap,Gr=new WeakMap,Yt=new WeakMap,We=new WeakMap,b=new WeakMap,Z=new WeakMap,Kt=new WeakMap,se=new WeakMap,Qt=new WeakMap,Je=new WeakMap,be=new WeakMap,Ee=new WeakMap,Te=new WeakMap,Pe=new WeakMap,Zt=new WeakMap,er=new WeakMap,$r=new WeakMap,qr=new WeakMap,P=new WeakSet,bi=function(){if(typeof window>"u")return;let e=o(this,Ae,"f").ownerDocument,t=e.compatMode==="BackCompat"?e.body:e.documentElement,r=t.clientWidth,i=t.clientHeight,n=window.scrollX,a=window.scrollY,f,c;if(o(this,Re,"f").fixedCanvas)f=0,c=0;else if(o(this,Re,"f").wrapper)f=r*o(this,Re,"f").scrollPadding[0],c=i*o(this,Re,"f").scrollPadding[1];else{let d=e.body.scrollWidth-(n+r),h=e.body.scrollHeight-(a+i);f=xi(r*o(this,Re,"f").scrollPadding[0],0,d),c=xi(i*o(this,Re,"f").scrollPadding[1],0,h)}let l=r+f*2,u=i+c*2;(l!==o(this,Je,"f")[0]||u!==o(this,Je,"f")[1])&&(o(this,Ae,"f").style.width=`${l}px`,o(this,Ae,"f").style.height=`${u}px`,o(this,R,"f").setSize(l,u,o(this,b,"f")),k(this,se,zt({top:-c,left:-f,right:r+f,bottom:i+c}),"f"),k(this,Qt,zt({top:0,left:0,right:r,bottom:i}),"f"),k(this,Je,[l,u],"f"),k(this,be,f,"f"),k(this,Ee,c,"f")),o(this,Re,"f").fixedCanvas||o(this,Ae,"f").style.setProperty("transform",`translate(${n-f}px, ${a-c}px)`)},jr=async function(e){if(!o(this,Zt,"f").get(e.element)){o(this,Zt,"f").set(e.element,!0);try{let t=e.srcTexture,r=t.source instanceof OffscreenCanvas?t.source:void 0,i=await Vt(e.element,e.originalOpacity,r,this.maxTextureSize);if(i.width===0||i.width===0)throw"omg";let n=new U(o(this,R,"f"),i);n.wrapS=t.wrapS,n.wrapT=t.wrapT,n.needsUpdate=!0,!e.chain&&e.passes.length>0&&(e.passes[0].uniforms.src.value=n),e.srcTexture=n,t.dispose()}catch(t){console.error(t)}o(this,Zt,"f").set(e.element,!1)}},Ei=async function(e,t,r,i){t.shader!==void 0&&console.warn("[VFX-JS] Both `shader` and `effect` specified; `effect` takes precedence."),t.overflow!==void 0&&console.warn("[VFX-JS] `overflow` is shader-path only and is ignored by the effect path. Use each effect's own `outputRect` (with `dims.canvasRect` for fullscreen) to control its dst rect.");let n=Array.isArray(r)?[...r]:[r];o(this,P,"m",Fs).call(this,n);let a=e.getBoundingClientRect(),f=Ui(e)?Fr(a):Pr(a),[c,l]=Ai(t.overflow),u=Vi(t.intersection),d=e.style.opacity===""?1:Number.parseFloat(e.style.opacity),h,p,v=!1;if(e instanceof HTMLImageElement)if(p="img",v=!!e.src.match(/\.gif/i),v){let T=await gt.create(e.src,o(this,b,"f"));Qr.set(e,T),h=new U(o(this,R,"f"),T.getCanvas())}else{let T=await sr(e.src);h=new U(o(this,R,"f"),T)}else if(e instanceof HTMLVideoElement)h=new U(o(this,R,"f"),e),p="video";else if(e instanceof HTMLCanvasElement)e.hasAttribute("layoutsubtree")&&i?(h=new U(o(this,R,"f"),i),p="hic"):(h=new U(o(this,R,"f"),e),p="canvas");else{let T=await Vt(e,d,void 0,this.maxTextureSize);h=new U(o(this,R,"f"),T),p="text"}let[w,F]=Ii(t.wrap);h.wrapS=w,h.wrapT=F,h.needsUpdate=!0;let M=t.autoCrop??!0;if(p!=="hic"){if(t.overlay!==!0)if(typeof t.overlay=="number")e.style.setProperty("opacity",t.overlay.toString());else{let T=p==="video"?"0.0001":"0";e.style.setProperty("opacity",T.toString())}}let y=Date.now()/1e3,E={type:p,element:e,isInViewport:!1,isInLogicalViewport:!1,width:f.right-f.left,height:f.bottom-f.top,passes:[],bufferTargets:new Map,startTime:y,enterTime:y,leaveTime:Number.NEGATIVE_INFINITY,release:t.release??Number.POSITIVE_INFINITY,isGif:v,isFullScreen:c,overflow:l,intersection:u,originalOpacity:d,srcTexture:h,zIndex:t.zIndex??0,backbuffer:void 0,autoCrop:M,effectLastRenderTime:y},_=pt(()=>E.srcTexture,()=>_i(E.srcTexture,"w"),()=>_i(E.srcTexture,"h")),S={},W={};if(t.uniforms)for(let[T,x]of Object.entries(t.uniforms))typeof x=="function"?(W[T]=x,S[T]=x()):S[T]=x;E.effectUniformGenerators=W,E.effectStaticUniforms=S;let J={autoCrop:M,glslVersion:t.glslVersion??"300 es"},A=new Xt(o(this,R,"f"),o(this,Ke,"f"),o(this,b,"f"),n,J,_,!1,o(this,xt,"f"));try{await A.initAll()}catch(T){throw o(this,P,"m",Jr).call(this,n),h.dispose(),e.style.setProperty("opacity",d.toString()),T}E.chain=A,o(this,P,"m",Kr).call(this,E,f,y),o(this,Z,"f").push(E),o(this,Z,"f").sort((T,x)=>T.zIndex-x.zIndex)},Ti=function(e){let t=i=>i.glslVersion===void 0&&e.glslVersion!==void 0?{...i,glslVersion:e.glslVersion}:i;if(Array.isArray(e.shader))return e.shader.map(t);let r=o(this,P,"m",Ss).call(this,e.shader||"uvGradient");return[t({frag:r})]},Pi=function(e,t,r,i){let n=e.chain;if(!n)return;let a=o(this,b,"f");Qr.get(e.element)?.update(),(e.type==="video"||e.isGif)&&(e.srcTexture.needsUpdate=!0);let f={...e.effectStaticUniforms??{}};if(e.effectUniformGenerators)for(let[E,_]of Object.entries(e.effectUniformGenerators))f[E]=_();let c=o(this,se,"f").right-o(this,se,"f").left,l=o(this,se,"f").bottom-o(this,se,"f").top,u=or(t,l,o(this,be,"f"),o(this,Ee,"f")),d=o(this,Te,"f")+o(this,be,"f")-u.x,h=o(this,Pe,"f")+o(this,Ee,"f")-u.y,p=t.right-t.left,v=t.bottom-t.top,w=e.effectLastRenderTime??i,F=i-w;e.effectLastRenderTime=i;let y=o(this,P,"m",Cs).call(this)&&o(this,D,"f")?Er(o(this,D,"f")):null;n.run({time:i-e.startTime,deltaTime:F,mouse:[d*a,h*a],mouseViewport:[o(this,Te,"f")*a,o(this,Pe,"f")*a],intersection:r.intersection,enterTime:i-e.enterTime,leaveTime:i-e.leaveTime,resolvedUniforms:f,canvasSize:[c,l],canvasBufferSize:[c*a,l*a],elementSize:[p,v],elementBufferSize:[p*a,v*a],elementRectOnCanvasPx:{x:u.x*a,y:u.y*a,w:u.w*a,h:u.h*a},finalTarget:y,isVisible:r.isVisible})},Cs=function(){return o(this,ae,"f").length>0||o(this,ne,"f")!==null&&o(this,Qe,"f")},Fs=function(e){for(let t of e)if(o(this,Oe,"f").has(t))throw new Error("[VFX-JS] Effect instance already attached. Construct a new instance per `vfx.add()` / `postEffect`.");for(let t of e)o(this,Oe,"f").add(t)},Jr=function(e){for(let t of e)o(this,Oe,"f").delete(t)},wi=function(e){let t=e.hitTestPadBuffer,r=o(this,b,"f");return Ge({top:t.top/r,right:t.right/r,bottom:t.bottom/r,left:t.left/r})},Kr=function(e,t,r){let i=e.chain?o(this,P,"m",wi).call(this,e.chain):e.overflow,n=Sr(t,i),a=e.isFullScreen||Mi(o(this,Qt,"f"),n),f=Sr(o(this,Qt,"f"),e.intersection.rootMargin),c=ni(f,t),l=e.isFullScreen||xo(f,t,c,e.intersection.threshold);!e.isInLogicalViewport&&l&&(e.enterTime=r,e.leaveTime=Number.POSITIVE_INFINITY),e.isInLogicalViewport&&!l&&(e.leaveTime=r),e.isInViewport=a,e.isInLogicalViewport=l;let u=a&&r-e.leaveTime<=e.release;if(u&&!e.chain&&e.passes.length>0){let d=e.passes[0].uniforms;d.intersection.value=c,d.enterTime.value=r-e.enterTime,d.leaveTime.value=r-e.leaveTime}return{isVisible:u,intersection:c,rectWithOverflow:n}},Ss=function(e){return e in rs?rs[e]:e},ce=function(e,t,r,i,n){let a=o(this,Ye,"f");n&&t!==null&&t!==o(this,D,"f")&&(a.bindFramebuffer(a.FRAMEBUFFER,t.fbo),a.viewport(0,0,t.width,t.height),a.clear(a.COLOR_BUFFER_BIT));let f=i.viewport;f&&f.value instanceof ge&&f.value.set(r.x*o(this,b,"f"),r.y*o(this,b,"f"),r.w*o(this,b,"f"),r.h*o(this,b,"f"));try{Ns(a,o(this,Ke,"f"),e,t,r,o(this,Je,"f")[0],o(this,Je,"f")[1],o(this,b,"f"))}catch(c){console.error(c)}},Yr=function(e,t,r){let i=e.passes[0].uniforms.offset.value;i.x=t*o(this,b,"f"),i.y=r*o(this,b,"f")},Fi=function(e){let t=e.length===1&&!("frag"in e[0])?e[0]:null;if(t&&t.effect!==void 0){o(this,P,"m",yi).call(this,t,t.effect);return}let r=[],i=[];for(let a of e)"frag"in a&&i.push(a);for(let a=0;a<i.length-1;a++)i[a].target||(i[a]={...i[a],target:`pass${a}`});for(let a of e){let f,c,l;if("frag"in a)f=a.frag,c=new qt(o(this,R,"f"),f,a.uniforms,a.persistent??!1,a.float??!1,a.size,a.target!==void 0,a.glslVersion),l=a.target;else{if(a.shader===void 0)throw new Error("VFXPostEffect requires `shader` (the `effect` path is not implemented yet).");f=o(this,P,"m",Ss).call(this,a.shader),c=new qt(o(this,R,"f"),f,a.uniforms,a.persistent??!1,a.float??!1,void 0,!1,a.glslVersion),a.persistent&&c.registerBufferUniform("backbuffer"),l=void 0}r.push(f);let u={};if(a.uniforms)for(let[d,h]of Object.entries(a.uniforms))typeof h=="function"&&(u[d]=h);o(this,ae,"f").push({pass:c,target:l,generators:u})}for(let a of i)a.target&&o(this,_t,"f").set(a.target,void 0);let n=o(this,ae,"f").map(a=>a.target).filter(a=>a!==void 0);for(let a=0;a<o(this,ae,"f").length;a++)for(let f of n)r[a].match(new RegExp(`uniform\\s+sampler2D\\s+${f}\\b`))&&o(this,ae,"f")[a].pass.registerBufferUniform(f)},yi=function(e,t){e.shader!==void 0&&console.warn("[VFX-JS] Both `shader` and `effect` specified on post-effect; `effect` takes precedence.");let r=Array.isArray(t)?[...t]:[t];o(this,P,"m",Fs).call(this,r);let i=pt(()=>{let f=o(this,D,"f");if(!f)throw new Error("[VFX-JS] post-effect chain active without target");return f.texture},()=>o(this,D,"f")?.width??0,()=>o(this,D,"f")?.height??0),n={autoCrop:!0,glslVersion:e.glslVersion??"300 es"},a=new Xt(o(this,R,"f"),o(this,Ke,"f"),o(this,b,"f"),r,n,i,!0,o(this,xt,"f"));if(e.uniforms)for(let[f,c]of Object.entries(e.uniforms))typeof c=="function"?(o(this,Gr,"f")[f]=c,o(this,Jt,"f")[f]=c()):o(this,Jt,"f")[f]=c;k(this,ne,a,"f"),k(this,Yt,Date.now()/1e3,"f"),a.initAll().then(()=>{o(this,ne,"f")===a&&k(this,Qe,!0,"f")}).catch(f=>{console.error("[VFX-JS] Post-effect init failed; post-effect disabled:",f),o(this,ne,"f")===a&&(o(this,P,"m",Jr).call(this,o(this,ne,"f").effects),o(this,ne,"f").dispose(),k(this,ne,null,"f"),k(this,Qe,!1,"f"))})},Si=function(e,t){let r=o(this,ne,"f");if(!r)return;let i=o(this,b,"f"),n={...o(this,Jt,"f")};for(let[p,v]of Object.entries(o(this,Gr,"f")))n[p]=v();let a=o(this,se,"f").right-o(this,se,"f").left,f=o(this,se,"f").bottom-o(this,se,"f").top,c=o(this,Yt,"f"),l=t-c;k(this,Yt,t,"f");let u=[a,f],d=[a*i,f*i],h={x:e.x*i,y:e.y*i,w:e.w*i,h:e.h*i};r.run({time:t-o(this,Kt,"f"),deltaTime:l,mouse:[o(this,Te,"f")*i,o(this,Pe,"f")*i],mouseViewport:[o(this,Te,"f")*i,o(this,Pe,"f")*i],intersection:1,enterTime:0,leaveTime:0,resolvedUniforms:n,canvasSize:u,canvasBufferSize:d,elementSize:u,elementBufferSize:d,elementRectOnCanvasPx:h,finalTarget:null,isVisible:!0})},Ri=function(e,t){if(!o(this,D,"f"))return;let r=o(this,D,"f").texture,i=new Map;for(let{pass:n,target:a}of o(this,ae,"f"))a&&n.backbuffer&&i.set(a,n.backbuffer.texture);for(let n=0;n<o(this,ae,"f").length;n++){let{pass:a,target:f,generators:c}=o(this,ae,"f")[n],l=n===o(this,ae,"f").length-1,u=o(this,Te,"f")+o(this,be,"f"),d=o(this,Pe,"f")+o(this,Ee,"f"),h=a.size;if(h){let[p,v]=h;a.uniforms.src.value=r,a.uniforms.resolution.value.set(p,v),a.uniforms.offset.value.set(0,0),a.uniforms.time.value=t-o(this,Kt,"f"),a.uniforms.mouse.value.set(u/e.w*p,d/e.h*v)}else a.setUniforms(r,o(this,b,"f"),e,t-o(this,Kt,"f"),u,d);a.uniforms.passIndex.value=n,a.updateCustomUniforms(c);for(let[p,v]of i){let w=a.uniforms[p];w&&(w.value=v)}if(l)a.backbuffer?(a.uniforms.backbuffer&&(a.uniforms.backbuffer.value=a.backbuffer.texture),o(this,P,"m",ce).call(this,a.pass,a.backbuffer.target,e,a.uniforms,!0),a.backbuffer.swap(),o(this,fe,"f").setUniforms(a.backbuffer.texture,o(this,b,"f"),e),o(this,P,"m",ce).call(this,o(this,fe,"f").pass,null,e,o(this,fe,"f").uniforms,!1)):o(this,P,"m",ce).call(this,a.pass,null,e,a.uniforms,!1);else if(a.backbuffer){a.uniforms.backbuffer&&(a.uniforms.backbuffer.value=a.backbuffer.texture);let p=h?Ie(0,0,h[0]/o(this,b,"f"),h[1]/o(this,b,"f")):e;o(this,P,"m",ce).call(this,a.pass,a.backbuffer.target,p,a.uniforms,!0),a.backbuffer.swap(),r=a.backbuffer.texture,f&&i.set(f,a.backbuffer.texture)}else{let p=f??`postEffect${n}`,v=o(this,_t,"f").get(p),w=h?h[0]:e.w*o(this,b,"f"),F=h?h[1]:e.h*o(this,b,"f");(!v||v.width!==w||v.height!==F)&&(v?.dispose(),v=Xr(o(this,R,"f"),w,F,{float:a.float}),o(this,_t,"f").set(p,v));let M=h?Ie(0,0,h[0]/o(this,b,"f"),h[1]/o(this,b,"f")):e;o(this,P,"m",ce).call(this,a.pass,v,M,a.uniforms,!0),r=v.texture,f&&i.set(f,v.texture)}}},Ci=function(e,t){let r=e*o(this,b,"f"),i=t*o(this,b,"f");(!o(this,D,"f")||o(this,D,"f").width!==r||o(this,D,"f").height!==i)&&(o(this,D,"f")?.dispose(),k(this,D,Xr(o(this,R,"f"),r,i),"f"));for(let{pass:n}of o(this,ae,"f"))n.persistent&&!n.backbuffer?n.initializeBackbuffer(o(this,R,"f"),e,t,o(this,b,"f")):n.backbuffer&&n.resizeBackbuffer(e,t)};function Mi(s,e){return e.left<=s.right&&e.right>=s.left&&e.top<=s.bottom&&e.bottom>=s.top}function xo(s,e,t,r){return r===0?Mi(s,e):t>=r}function Ai(s){return s===!0?[!0,ws]:s===void 0?[!1,ws]:[!1,Ge(s)]}function Vi(s){let e=s?.threshold??0,t=Ge(s?.rootMargin??0);return{threshold:e,rootMargin:t}}function _i(s,e){let t=s.source;if(!t)return 0;if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement)return e==="w"?t.naturalWidth:t.naturalHeight;if(typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement)return e==="w"?t.videoWidth:t.videoHeight;let r=t;return e==="w"?r.width:r.height}function Rs(s){return s==="repeat"?"repeat":s==="mirror"?"mirror":"clamp"}function Ii(s){if(!s)return["clamp","clamp"];if(Array.isArray(s))return[Rs(s[0]),Rs(s[1])];let e=Rs(s);return[e,e]}function xi(s,e,t){return Math.max(e,Math.min(t,s))}function Ui(s){return!(s instanceof HTMLImageElement||s instanceof HTMLVideoElement||s instanceof HTMLCanvasElement)}function ki(){try{let s=document.createElement("canvas");return(s.getContext("webgl2")||s.getContext("webgl"))!==null}catch{return!1}}var Bi=function(s,e,t,r,i){if(r==="m")throw new TypeError("Private method is not writable");if(r==="a"&&!i)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!i:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return r==="a"?i.call(s,t):i?i.value=t:e.set(s,t),t},C=function(s,e,t,r){if(t==="a"&&!r)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!r:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?r:t==="a"?r.call(s):r?r.value:e.get(s)},bt,B,es,Ce,Li,zi,Wi,Oi;function bo(){if(typeof window>"u")throw"Cannot find 'window'. VFX-JS only runs on the browser.";if(typeof document>"u")throw"Cannot find 'document'. VFX-JS only runs on the browser."}function Eo(s){return{position:s?"fixed":"absolute",top:0,left:0,width:"0px",height:"0px","z-index":9999,"pointer-events":"none"}}var Ms=class s{static init(e){try{return new s(e)}catch{return null}}constructor(e={}){if(bt.add(this),B.set(this,void 0),es.set(this,void 0),Ce.set(this,new Map),bo(),!ki())throw new Error("[VFX-JS] WebGL is not available in this environment.");let t=ks(e),r=document.createElement("canvas"),i=Eo(t.fixedCanvas);for(let[n,a]of Object.entries(i))r.style.setProperty(n,a.toString());t.zIndex!==void 0&&r.style.setProperty("z-index",t.zIndex.toString()),(t.wrapper??document.body).appendChild(r),Bi(this,es,r,"f"),Bi(this,B,new Zr(t,r),"f"),t.autoplay&&C(this,B,"f").play()}async add(e,t,r){e instanceof HTMLImageElement?await C(this,bt,"m",Li).call(this,e,t):e instanceof HTMLVideoElement?await C(this,bt,"m",zi).call(this,e,t):e instanceof HTMLCanvasElement?e.hasAttribute("layoutsubtree")&&r?await C(this,B,"f").addElement(e,t,r):await C(this,bt,"m",Wi).call(this,e,t):await C(this,bt,"m",Oi).call(this,e,t)}updateHICTexture(e,t){C(this,B,"f").updateHICTexture(e,t)}get maxTextureSize(){return C(this,B,"f").maxTextureSize}async addHTML(e,t){if(!ls())return console.warn("html-in-canvas not supported, falling back to dom-to-canvas"),this.add(e,t);t.overlay!==void 0&&console.warn("addHTML does not support overlay mode (layoutsubtree hides children). Ignoring overlay option.");let{overlay:r,...i}=t,n=C(this,Ce,"f").get(e);n&&C(this,B,"f").removeElement(n);let{canvas:a,initialCapture:f}=await Us(e,{onCapture:c=>{C(this,B,"f").updateHICTexture(a,c)},maxSize:C(this,B,"f").maxTextureSize});n=a,C(this,Ce,"f").set(e,n),await C(this,B,"f").addElement(n,i,f)}remove(e){let t=C(this,Ce,"f").get(e);t?(cs(t,e),C(this,Ce,"f").delete(e),C(this,B,"f").removeElement(t)):C(this,B,"f").removeElement(e)}updateEffects(e,t){let r=C(this,Ce,"f").get(e)??e;return C(this,B,"f").updateElementEffects(r,t)}async update(e){let t=C(this,Ce,"f").get(e);if(t){t.requestPaint();return}if(e instanceof HTMLImageElement)return C(this,B,"f").updateImageElement(e);if(e instanceof HTMLCanvasElement){C(this,B,"f").updateCanvasElement(e);return}else return C(this,B,"f").updateTextElement(e)}play(){C(this,B,"f").play()}stop(){C(this,B,"f").stop()}render(){C(this,B,"f").render()}destroy(){for(let[e,t]of C(this,Ce,"f"))cs(t,e);C(this,Ce,"f").clear(),C(this,B,"f").destroy(),C(this,es,"f").remove()}};B=new WeakMap,es=new WeakMap,Ce=new WeakMap,bt=new WeakSet,Li=function(e,t){return e.complete?C(this,B,"f").addElement(e,t):new Promise(r=>{e.addEventListener("load",()=>{C(this,B,"f").addElement(e,t),r()},{once:!0})})},zi=function(e,t){return e.readyState>=3?C(this,B,"f").addElement(e,t):new Promise(r=>{e.addEventListener("canplay",()=>{C(this,B,"f").addElement(e,t),r()},{once:!0})})},Wi=function(e,t){return C(this,B,"f").addElement(e,t)},Oi=function(e,t){return C(this,B,"f").addElement(e,t)};export{Ms as VFX};
