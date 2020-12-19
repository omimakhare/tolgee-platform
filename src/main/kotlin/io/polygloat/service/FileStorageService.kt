/*
 * Copyright (c) 2020. Polygloat
 */

package io.polygloat.service

import com.amazonaws.services.s3.AmazonS3
import com.amazonaws.services.s3.model.ObjectMetadata
import com.amazonaws.services.s3.model.PutObjectRequest
import io.polygloat.configuration.polygloat.PolygloatProperties
import io.polygloat.exceptions.FileDeleteException
import org.springframework.stereotype.Service
import java.io.ByteArrayInputStream
import java.io.File

@Service
open class FileStorageService(
        polygloatProperties: PolygloatProperties,
        private val s3: AmazonS3?,
) {

    private val isS3 = polygloatProperties.fileStorage.s3.enabled
    private val bucketName = polygloatProperties.fileStorage.s3.bucketName
    private val localDataPath = polygloatProperties.fileStorage.fsDataPath

    fun readFile(storageFilePath: String): ByteArray {
        if (isS3) {
            return s3!!.getObject(bucketName, storageFilePath).objectContent.readAllBytes()
        }
        return getLocalFile(storageFilePath).readBytes()
    }

    fun deleteFile(storageFilePath: String) {
        if (isS3) {
            try {
                s3!!.deleteObject(bucketName, storageFilePath)
                return
            } catch (e: Exception) {
                throw FileDeleteException("Can not delete file using s3 bucket!", storageFilePath, e)
            }
        }
        try {
            getLocalFile(storageFilePath).delete()
        } catch (e: Exception) {
            throw FileDeleteException("Can not delete file from local filesystem!", storageFilePath, e)
        }
    }

    fun storeFile(storageFilePath: String, bytes: ByteArray) {
        if (isS3) {
            val byteArrayInputStream = ByteArrayInputStream(bytes)
            val meta = ObjectMetadata()
            meta.contentLength = bytes.size.toLong()
            val putObjectRequest = PutObjectRequest(
                    bucketName,
                    storageFilePath,
                    byteArrayInputStream, meta)
            try {
                s3!!.putObject(putObjectRequest)
            } catch (e: Exception) {
                throw FileDeleteException("Can not store file using s3 bucket!", storageFilePath, e)
            }
            return
        }
        val file = getLocalFile(storageFilePath)
        try {
            file.parentFile.mkdirs()
            file.writeBytes(bytes)
        } catch (e: Exception) {
            throw FileDeleteException("Can not store file to local filesystem!", storageFilePath, e)
        }
    }

    fun fileExists(storageFilePath: String): Boolean {
        if (isS3) {
            return s3!!.doesObjectExist(bucketName, storageFilePath)
        }
        return getLocalFile(storageFilePath).exists()
    }

    private fun getLocalFile(storageFilePath: String): File {
        return File("${localDataPath}/${storageFilePath}")
    }
}