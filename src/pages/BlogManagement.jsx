import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Upload,
  Popconfirm,
  message,
} from "antd";
import { useState, useEffect } from "react";
import {
  EditOutlined,
  DeleteOutlined,
  PlusSquareOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BlogServices from "../services/blog.services";
import FeatureServices from "../services/feature.services";
import { baseUrl } from "../constants/env";

const { processAddBlog, processDeleteBlog, processEditBlog, processGetBlogs } = BlogServices;
const { processGetFeature } = FeatureServices;

const { Option } = Select;

const BlogManagement = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  const queryClient = useQueryClient();

  // Fetch features
  const { data: featureRes, isLoading: isFeaturePending } = useQuery({
    queryKey: ["features"],
    queryFn: processGetFeature,
  });
  const features = featureRes?.data || [];

  // Fetch blogs
  const { data: blogRes, isLoading: isBlogLoading, isError: isBlogError } = useQuery({
    queryKey: ["blogs"],
    queryFn: processGetBlogs,
  });
  const blogs = blogRes || [];

  useEffect(() => {
    if (isBlogError) {
      message.error("Error fetching blogs");
    }
  }, [isBlogError]);

  // Add Blog
  const { mutate: addBlog, isLoading: isAdding } = useMutation({
    mutationFn: processAddBlog,
    onSuccess: () => {
      message.success("Blog added successfully");
      queryClient.invalidateQueries(["blogs"]);
      handleModalCancel();
    },
    onError: () => {
      message.error("Failed to add blog");
    },
  });

  // Edit Blog
  const { mutate: editBlog, isLoading: isEditing } = useMutation({
    mutationFn: ({ id, data }) => processEditBlog(id, data),
    onSuccess: () => {
      message.success("Blog updated successfully");
      queryClient.invalidateQueries(["blogs"]);
      handleModalCancel();
    },
    onError: () => {
      message.error("Failed to update blog");
    },
  });

  // Delete Blog
  const { mutate: deleteBlog, isLoading: isDeleting } = useMutation({
    mutationFn: processDeleteBlog,
    onSuccess: () => {
      message.success("Blog deleted successfully");
      queryClient.invalidateQueries(["blogs"]);
    },
    onError: () => {
      message.error("Failed to delete blog");
    },
  });

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileList([]);
    setEditingBlog(null);
  };

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleRemoveImage = (file) => {
    setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    return false;
  };

  const handleFormSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("blogTitle", values.blogTitle);
      formData.append("blogDescription", values.blogDescription || "");
      formData.append("feature", values.feature || "");

      values.tags?.forEach((tag) => {
        formData.append("tags", tag);
      });

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("blogImage", fileList[0].originFileObj);
      }

      if (editingBlog) {
        editBlog({ id: editingBlog._id, data: formData });
      } else {
        addBlog(formData);
      }
    } catch (err) {
      console.error("Error submitting blog form:", err);
      message.error("Failed to submit blog");
    }
  };

  const handleEdit = (record) => {
    setEditingBlog(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      blogTitle: record.blogTitle,
      blogDescription: record.blogDescription,
      feature: record.feature?._id,
      tags: record.tags,
    });
    setFileList([
      {
        uid: "-1",
        name: record.blogImage,
        status: "done",
        url: `${baseUrl}${record.blogImage}`,
      },
    ]);
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "blogImage",
      key: "blogImage",
      render: (imgUrl) => (
        <img src={`${baseUrl}${imgUrl}`} alt="blog" className="w-[200px] rounded" />
      ),
    },
    {
      title: "Title",
      dataIndex: "blogTitle",
      key: "blogTitle",
    },
    {
      title: "Feature",
      dataIndex: "feature",
      key: "feature",
      render: (feature) => feature?.featureName || "Unknown",
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags) => tags?.join(", "),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure to delete this blog?"
            onConfirm={() => deleteBlog(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-white my-6 p-8 rounded-md">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Blogs</h1>
        <Button onClick={() => setIsModalVisible(true)}>
          <PlusSquareOutlined /> Add Blog
        </Button>
      </div>

      <Table
        dataSource={blogs}
        columns={columns}
        rowKey="_id"
        loading={isBlogLoading || isDeleting}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={editingBlog ? "Edit Blog" : "Create Blog"}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="blogTitle"
            label="Blog Title"
            rules={[{ required: true, message: "Please enter the blog title" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="blogDescription" label="Blog Description">
            <ReactQuill />
          </Form.Item>

          <Form.Item name="feature" label="Feature">
            <Select placeholder="Select Feature" loading={isFeaturePending}>
              {features.map((feature) => (
                <Option key={feature._id} value={feature._id}>
                  {feature.featureName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Enter tags" />
          </Form.Item>

          <Form.Item label="Blog Image">
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={handleFileChange}
              onRemove={handleRemoveImage}
              multiple={false}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            className="w-full"
            loading={isAdding || isEditing}
          >
            {editingBlog ? "Update" : "Create"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default BlogManagement;
