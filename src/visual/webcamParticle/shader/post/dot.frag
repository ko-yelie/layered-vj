precision mediump float;
uniform vec2      resolution;
uniform sampler2D texture;

const float size = 12.0;           // モザイク模様ひとつあたりのサイズ
const float halfSize = size * 0.5; // モザイク模様のサイズの半分 (10.0)

void main(){
    // スクリーン座標を均等に分割し範囲を size の領域に限定する（-size / 2 ～ size / 2） @@@
    // mod: 除算の剰余
    // 0.0 ~ 19.999... - 10.0 = -10.0 ~ 10.0
    vec2 p = mod(gl_FragCoord.st, size) - halfSize;

    // ベクトルの長さを測り二値化する @@@
    // その中心から 9.0 の距離以内だけ色を塗る
    float len = step(length(p), halfSize - 1.0);
    // アンチエイリアスする場合の例
    // smoothstep(最小値, 最大値, 計測値)
    // 計測値が最小値と最大値に対して相対的な位置 (0.0 ~ 1.0) を返す (clamp 効果もある)
    // smoothstep(0.0, 10.0, 5.0) === 0.5
    // エルミート補間
    // 円の縁でだんだん暗くなるように値を減少させる
    float edge = 1.0 - smoothstep(halfSize - 2.5, halfSize, length(p));
    len *= edge;

    // スクリーン座標をサイズで割ってからサイズを掛ける
    vec2 texCoord = floor(gl_FragCoord.st / size) * size;

    // フレームバッファの描画結果をテクスチャから読み出す
    vec4 samplerColor = texture2D(texture, texCoord / resolution);

    // テクスチャの色にノイズの値を掛ける
    gl_FragColor = samplerColor * vec4(vec3(len), 1.0);
}
