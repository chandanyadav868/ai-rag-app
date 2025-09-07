import { BLEND_MODES, FontFamily, FontStyle, FontWeight, shadowOptions, TextAlign } from '@/constant'
import React, { useEffect } from 'react'

interface TextToolProp {
    selectedId: string;
    activeItem: StateProps;
    shapeDesignDiv: (selectedId: string, { }: Record<string, string | number | boolean>) => void
    filterSetting:(selected:string,obj:Record<string,any>)=> void
}

function TextTool({ selectedId, activeItem, shapeDesignDiv,filterSetting }: TextToolProp) {

    useEffect(() => {

    }, [selectedId])


    return (
        <div className='flex flex-col gap-2 flex-wrap'>
            {/* FontFamily */}
           {activeItem.type === "text" && <span>
                <span className='font-bold'>FontFamily </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { fontFamily: e.target.value })
                    }}
                    value={activeItem?.fontFamily || "normal"} name="fontfamily" id="fontfamily">
                    {FontFamily.map((v, i) => (
                        <option className='font-bold' key={i} id={"fontfamily"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span>}
            {/* FontSize */}
            {activeItem.type === "text" && <span>
                <span className='font-bold'>FontSize </span>
                {<input type="number" className='inputNumStyle' min={1} value={activeItem?.fontSize || 1} onChange={(e) => { shapeDesignDiv(selectedId ?? "", { fontSize: Number(e.target.value) }) }} />}
            </span> }
            {/* FontStyle */}
           {activeItem.type === "text" && <span>
                <span className='font-bold'>FontStyle </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { fontStyle: e.target.value })
                    }}
                    value={activeItem?.fontStyle || "normal"} name="blendMode" id="blendMode">
                    {FontStyle.map((v, i) => (
                        <option className='font-bold' key={i} id={"blendMode"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span> }
            {/* FontWeight */}
           {activeItem.type === "text" && <span>
                <span className='font-bold'>FontWeight </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { fontWeight: e.target.value })
                    }}
                    value={activeItem?.fontWeight || "100"} name="fontWeight" id="fontWeight">
                    {FontWeight.map((v, i) => (
                        <option className='font-bold' key={i} id={"fontWeight"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span> }
            {/* TextAlign */}
           {activeItem.type === "text" && <span>
                <span className='font-bold'>TextAlign </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { textAlign: e.target.value as TextAlignProps })
                    }}
                    value={activeItem?.textAlign || "left"} name="textAlign" id="textAlign">
                    {TextAlign.map((v, i) => (
                        <option className='font-bold' key={i} id={"textAlign"} value={v.toLocaleLowerCase()}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span> }
            {/* CharSpacing */}
           {activeItem.type === "text" && <span>
                <span className='font-bold'>CharSpacing </span>
                {<input type="number" step={.1} className='h-[30px] inputNumStyle' value={activeItem?.charSpacing || 0 } onChange={(e) => { shapeDesignDiv(selectedId ?? "", { charSpacing: Number(e.target.value) }) }} />}
            </span> }
            {/* Blur */}
           {activeItem.type === "image" && <span>
                <span className='font-bold'>Blur </span>
                {<input type="number" step={.1}  className='h-[30px] inputNumStyle' value={activeItem?.Blur || 0 } onChange={(e) => { filterSetting(selectedId ?? "", { Blur: Number(e.target.value) }) }} />}
            </span> }
            {/* Noise */}
            {activeItem.type === "image" && <span>
                <span className='font-bold'>Noise </span>
                {<input type="number" step={10}  className='h-[30px] inputNumStyle' value={activeItem?.Noise || 0 } onChange={(e) => { filterSetting(selectedId ?? "", { Noise: Number(e.target.value) }) }} />}
            </span> }
            {/* Pixelate */}
             {activeItem.type === "image" &&<span>
                <span className='font-bold'>Pixelate </span>
                {<input type="number" step={1}  className='h-[30px] inputNumStyle' value={activeItem?.Blocksize || 0 } onChange={(e) => { filterSetting(selectedId ?? "", { Blocksize: Number(e.target.value) }) }} />}
            </span>}
            {/* Brightness */}
            {activeItem.type === "image" && <span>
                <span className='font-bold'>Brightness </span>
                {<input type="number" step={.1}  className='h-[30px] inputNumStyle' value={activeItem?.Brightness || 0 } onChange={(e) => { filterSetting(selectedId ?? "", { Brightness: Number(e.target.value) }) }} />}
            </span>}
            {/* Contrast */}
            {activeItem.type === "image" && <span>
                <span className='font-bold'>Contrast </span>
                {<input type="number" step={.1}  className='h-[30px] inputNumStyle' value={activeItem?.Contrast || 0 } onChange={(e) => { filterSetting(selectedId ?? "", { Contrast: Number(e.target.value) }) }} />}
            </span> }
            {/* Saturation */}
            {activeItem.type === "image" && <span>
                <span className='font-bold'>Saturation </span>
                {<input type="number" step={.1}  className='h-[30px] inputNumStyle' value={activeItem?.Saturation || 0 } onChange={(e) => { filterSetting(selectedId ?? "", { Saturation: Number(e.target.value) }) }} />}
            </span>}
            {/* Vibrance */}
            {activeItem.type === "image" && <span>
                <span className='font-bold'>Vibrance </span>
                {<input type="number" step={.1}  className='h-[30px] inputNumStyle' value={activeItem?.Vibrance || 0 } onChange={(e) => { filterSetting(selectedId ?? "", { Vibrance: Number(e.target.value) }) }} />}
            </span> }
            
            {/* Blend */}
            <span>
                <span className='font-bold'>Blend </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { globalCompositeOperation: e.target.value as BlendMode })
                    }}
                    value={activeItem?.globalCompositeOperation || "normal"} name="blendMode" id="blendMode">
                    {BLEND_MODES.map((v, i) => (
                        <option className='font-bold' key={i} id={"blendMode"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span>
            {/* BackgroundColor */}
             {activeItem.type === "text" && <span>
                <span className='font-bold mr-2'>BackgroundColor</span>
                {<input type="color" className='h-[30px]' value={activeItem?.backgroundColor??"#00000000" } onChange={(e) => { shapeDesignDiv(selectedId ?? "", { backgroundColor: e.target.value }) }} />}
            </span> }
            {/* strokeColor */}
            <span>
                <span className='font-bold mr-2'>stroke</span>
                {<input type="color" className='h-[30px]' value={activeItem?.stroke??"#00000000" } onChange={(e) => { shapeDesignDiv(selectedId ?? "", { stroke: e.target.value }) }} />}
            </span>
            {/* strokeWidth */}
            <span>
                <span className='font-bold mr-2'>strokeWidth</span>
                {<input type="number" className='inputNumStyle' value={activeItem?.strokeWidth?? 1 } onChange={(e) => { shapeDesignDiv(selectedId ?? "", { strokeWidth: Number(e.target.value) }) }} />}
            </span>
            {/* LineHeight */}
            {activeItem.type === "text" && <span>
                <span className='font-bold mr-2'>LineHeight </span>
                {<input type="number" step={.1} className='inputNumStyle' value={activeItem?.lineHeight || 1} onChange={(e) => { shapeDesignDiv(selectedId ?? "", { lineHeight: Number(e.target.value) }) }} />}

            </span>    }
            {/* Linethrough */}
             {activeItem.type === "text" && <span>
                <span className='font-bold'>Linethrough </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { linethrough: (e.target.value === "true" ) })
                    }}
                    value={String(activeItem?.linethrough) || "false"} name="linethrough" id="linethrough">
                    {["false", "true"].map((v, i) => (
                        <option className='font-bold' key={i} id={"linethrough"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span> }
            {/* FlipX */}
            <span>
                <span className='font-bold'>FlipX </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { flipX: (e.target.value === "true" ) })
                    }}
                    value={String(activeItem?.flipX) || "false"} name="flipX" id="flipX">
                    {["false", "true"].map((v, i) => (
                        <option className='font-bold' key={i} id={"flipX"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span>
            {/* FlipY */}
            <span>
                <span className='font-bold'>FlipY </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { flipY: (e.target.value === "true") })
                    }}
                    value={String(activeItem?.flipY) || "false"} name="flipY" id="flipY">
                    {["false", "true"].map((v, i) => (
                        <option className='font-bold' key={i} id={"flipY"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span>
            {/* SkewX */}
            <span>
                <span className='font-bold mr-2'>SkewX </span>
                {<input type="number" step={.1} className='inputNumStyle'  value={activeItem?.skewX || 0} onChange={(e) => { shapeDesignDiv(selectedId ?? "", { skewX: Number(e.target.value) }) }} />}

            </span>
            {/* SkewY */}
            <span>
                <span className='font-bold mr-2'>SkewY </span>
                {<input type="number" step={.1} className='inputNumStyle'  value={activeItem?.skewY || 0} onChange={(e) => { shapeDesignDiv(selectedId ?? "", { skewY: Number(e.target.value) }) }} />}

            </span>
            {/* Overline */}
            {activeItem.type === "text" && <span>
                <span className='font-bold'>Overline </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { overline: e.target.value === "true" })
                    }}
                    value={String(activeItem?.overline) || "false"} name="overline" id="overline">
                    {["false", "true"].map((v, i) => (
                        <option className='font-bold' key={i} id={"overline"} value={v}>
                            {v}
                        </option>
                    ))}
                </select>}
            </span> }
            {/* Color */}
             {activeItem.type !== "image"  && <span className={`spanStyle ${activeItem?.type === "image" ? "hidden" : "block"}`}>
                <span className={`font-bold mr-2`}>Color</span>
                {<input type="color" className='h-[30px]' value={activeItem?.fill || "#c61010"} onChange={(e) => { shapeDesignDiv(selectedId ?? "", { fill: (e.target.value) }) }} />}

            </span> }
             {/* Shadow */}
            <span className='spanStyle'>
                   <span className='font-bold mr-2'>Shadow </span>
                {<select
                    className='font-bold inputNumStyle'
                    style={{ width: "100px" }}
                    onChange={(e) => {
                        shapeDesignDiv(selectedId ?? "", { shadow: e.target.value })
                    }}
                    value={String(activeItem?.shadow) || "none"} name="shadow" id="shadow">
                    {shadowOptions.map((v, i) => (
                        <option className='font-bold' key={i} id={"shadow"} value={v.value}>
                            {v.label}
                        </option>
                    ))}
                </select>}
                
            </span>
            {/* border radius */}
             <span className='spanStyle'>
                <span className='font-bold mr-2'>Border Radius</span>
                {<input type="number" className='inputNumStyle' min={0} value={activeItem?.rx || 0} onChange={(e) => { shapeDesignDiv(selectedId ?? "", { rx: Number(e.target.value), ry: Number(e.target.value) }) }} />}
            </span>
            {/* rotation */}
            <span className='spanStyle'>
                <span className='font-bold mr-2'>Rotation</span>
                {<input type="number" step={.1} className='inputNumStyle' value={activeItem?.angle || 0} onChange={(e) => {
                    shapeDesignDiv(selectedId ?? "", {
                        rotatingPointOffset: 100, angle: Number(e.target.value)
                    })
                }} />}
            </span>
        </div>
    )
}

export default TextTool