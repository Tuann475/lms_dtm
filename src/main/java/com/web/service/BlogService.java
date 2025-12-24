package com.web.service;

import com.web.entity.Authority;
import com.web.entity.Blog;
import com.web.entity.User;
import com.web.exception.MessageException;
import com.web.repository.AuthorityRepository;
import com.web.repository.BlogRepository;
import com.web.repository.UserRepository;
import com.web.utils.CommonPage;
import com.web.utils.UserUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
public class BlogService {

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private UserUtils userUtils;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthorityRepository authorityRepository;

    public Blog save(Blog blog) {
        blog.setUser(userUtils.getUserWithAuthority());
        blog.setCreatedDate(new Date(System.currentTimeMillis()));
        Blog result = blogRepository.save(blog);
        return result;
    }

    public void delete(Long id) {
        blogRepository.deleteById(id);
    }

    public Blog findById(Long id) {
        return blogRepository.findById(id).get();
    }

    public Page<Blog> findAll(String search, Pageable pageable) {
        if (search == null) {
            search = "";
        }
        search = "%" + search + "%";
        Page<Blog> page = blogRepository.findAll(search, pageable);
        return page;
    }

    public List<Blog> findAll() {
        List<Blog> list = blogRepository.findAll();
        return list;
    }

    public void crawl() throws IOException {
        Document doc = Jsoup.connect("https://study4.com/posts/?page=4").get();
        Element element = doc.getElementsByClass("posts-list").get(0);
        Elements listbv = element.getElementsByClass("postlist-card");
//        User user = userUtils.getUserWithAuthority();
        User user = userRepository.findById(0L).orElse(null);
        ExecutorService es = Executors.newCachedThreadPool();

        for (int x = 0; x < listbv.size(); x++) {
            int i = x;
            es.execute(() -> {
                Blog blog = new Blog();

                try {
                    Element bv = listbv.get(i);
                    Element imgElement = bv.getElementsByClass("postlist-card-img").get(0);
                    String image = "https://study4.com" + imgElement.getElementsByTag("img").get(0).attr("data-src");
                    blog.setCreatedDate(new Date(System.currentTimeMillis()));
                    blog.setImageBanner(image);
                    blog.setUser(user);
                    System.out.println("image: " + image);

                    Element titleElm = bv.getElementsByClass("postlist-title").get(0);
                    String title = titleElm.getElementsByTag("a").get(0).text();
                    blog.setTitle(title);
                    System.out.println("title: " + title);

                    Element desElm = bv.getElementsByClass("postlist-card-content").get(0).getElementsByTag("p").get(0);
                    blog.setDescription(desElm.text());
                    System.out.println("description: " + desElm.text());

                    String linkctn = titleElm.getElementsByTag("a").get(0).attr("href");
                    linkctn = "https://study4.com" + linkctn;

                    // Xử lý lấy nội dung chi tiết của bài viết
                    Document docs = Jsoup.connect(linkctn).get();
                    Element contElm = docs.getElementById("post-content");
                    if (contElm != null) {
                        String content = contElm.html();
                        blog.setContent(content);
                        blogRepository.save(blog);
                        System.out.println("Blog saved successfully: " + title);
                    } else {
                        System.out.println("Content element not found for: " + linkctn);
                    }

                } catch (NumberFormatException e) {
                    System.out.println("Lỗi chuyển đổi số: " + e.getMessage());
                } catch (IOException e) {
                    System.out.println("Lỗi khi kết nối đến URL hoặc xử lý dữ liệu: " + e.getMessage());
                } catch (Exception e) {
                    System.out.println("Lỗi không xác định: " + e.getMessage());
                }
            });
        }
        es.shutdown();
    }


}
