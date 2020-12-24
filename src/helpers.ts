import UniFormData from 'form-data'
import { Config, RequestConfig, RequestFunctionParams } from './types'

/**
 * 定义配置。
 *
 * @param config 配置
 */
export function defineConfig(config: Config) {
  return config
}

export class FileData<T = any> {
  /**
   * 原始文件数据。
   */
  private originalFileData: T

  /**
   * 选项。
   */
  private options: UniFormData.AppendOptions | undefined

  /**
   * 文件数据辅助类，统一网页、小程序等平台的文件上传。
   *
   * @param originalFileData 原始文件数据
   * @param options 若使用内部的 getFormData，则选项会被其使用
   */
  public constructor(originalFileData: T, options?: UniFormData.AppendOptions) {
    this.originalFileData = originalFileData
    this.options = options
  }

  /**
   * 获取原始文件数据。
   *
   * @returns 原始文件数据
   */
  public getOriginalFileData(): T {
    return this.originalFileData
  }

  /**
   * 获取选项。
   */
  public getOptions(): UniFormData.AppendOptions | undefined {
    return this.options
  }
}

/**
 * 解析请求数据，从请求数据中分离出普通数据和文件数据。
 *
 * @param [requestData] 要解析的请求数据
 * @returns 包含普通数据(data)和文件数据(fileData)的对象，data、fileData 为空对象时，表示没有此类数据
 */
export function parseRequestData(
  requestData?: any,
): { data: any; fileData: any } {
  const result = {
    data: {} as any,
    fileData: {} as any,
  }
  /* istanbul ignore else */
  if (requestData != null) {
    if (typeof requestData === 'object' && !Array.isArray(requestData)) {
      Object.keys(requestData).forEach(key => {
        if (requestData[key] && requestData[key] instanceof FileData) {
          result.fileData[key] = (requestData[
            key
          ] as FileData).getOriginalFileData()
        } else {
          result.data[key] = requestData[key]
        }
      })
    } else {
      result.data = requestData
    }
  }
  return result
}

/**
 * 准备要传给请求函数的参数。
 */
export function prepare(
  requestConfig: RequestConfig,
  requestData: any,
): RequestFunctionParams {
  let requestPath: string = requestConfig.path
  const { data, fileData } = parseRequestData(requestData)
  const dataIsObject =
    data != null && typeof data === 'object' && !Array.isArray(data)
  if (dataIsObject) {
    // 替换路径参数
    if (
      Array.isArray(requestConfig.paramNames) &&
      requestConfig.paramNames.length > 0
    ) {
      Object.keys(data).forEach(key => {
        if (requestConfig.paramNames.indexOf(key) >= 0) {
          // ref: https://github.com/YMFE/yapi/blob/master/client/containers/Project/Interface/InterfaceList/InterfaceEditForm.js#L465
          requestPath = requestPath
            .replace(new RegExp(`\\{${key}\\}`, 'g'), data[key])
            .replace(new RegExp(`/:${key}(?=/|$)`, 'g'), `/${data[key]}`)
          delete data[key]
        }
      })
    }

    // 追加查询参数到路径上
    let queryString = ''
    if (
      Array.isArray(requestConfig.queryNames) &&
      requestConfig.queryNames.length > 0
    ) {
      Object.keys(data).forEach(key => {
        if (requestConfig.queryNames.indexOf(key) >= 0) {
          if (data[key] != null) {
            queryString += `${queryString ? '&' : ''}${encodeURIComponent(
              key,
            )}=${encodeURIComponent(data[key])}`
          }
          delete data[key]
        }
      })
    }
    if (queryString) {
      requestPath += `${
        requestPath.indexOf('?') > -1 ? '&' : '?'
      }${queryString}`
    }
  }

  // 全部数据
  const allData = {
    ...(dataIsObject ? data : {}),
    ...fileData,
  }

  // 获取表单数据
  const getFormData = () => {
    const formData = new UniFormData()
    Object.keys(data).forEach(key => {
      formData.append(key, data[key])
    })
    Object.keys(fileData).forEach(key => {
      formData.append(
        key,
        fileData[key],
        (requestData[key] as FileData).getOptions(),
      )
    })
    return formData as any
  }

  return {
    ...requestConfig,
    path: requestPath,
    rawData: requestData,
    data: data,
    hasFileData: fileData && Object.keys(fileData).length > 0,
    fileData: fileData,
    allData: allData,
    getFormData: getFormData,
  }
}
